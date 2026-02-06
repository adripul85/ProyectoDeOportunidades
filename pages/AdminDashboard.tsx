import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useNotification } from '../App';
import { getAllUsers, updateUserVerification, updateUserRole, updateUserWallet, deleteUserByAdmin, getPlatformStats } from '../lib/admin';
import { UserProfile } from '../lib/users';
import LoadingSpinner from '../components/LoadingSpinner';

export default function AdminDashboard() {
    const { user, userProfile } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'finance' | 'disputes'>('users');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
    const [disputeMessages, setDisputeMessages] = useState<any[]>([]);
    const [disputeEvidence, setDisputeEvidence] = useState<any[]>([]);

    useEffect(() => {
        if (!user || (userProfile?.role !== 'admin' && userProfile?.role !== 'moderator')) {
            navigate('/');
            notify({
                type: 'error',
                title: 'Acceso Denegado',
                message: 'No posees las credenciales requeridas para este sector.',
                icon: 'lock'
            });
            return;
        }

        loadData();
    }, [user, userProfile]);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        setFilteredUsers(
            users.filter(u =>
                u.displayName.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term) ||
                u.uid.toLowerCase().includes(term)
            )
        );
    }, [searchTerm, users]);

    const loadData = async () => {
        setLoading(true);
        const { getDisputedTransactions } = await import('../lib/admin');
        const [usersData, statsData, disputesData] = await Promise.all([
            getAllUsers(),
            getPlatformStats(),
            getDisputedTransactions()
        ]);
        setUsers(usersData);
        setFilteredUsers(usersData);
        setStats(statsData);
        setDisputes(disputesData);
        setLoading(false);
    };

    const handleInspectDispute = async (dispute: any) => {
        setSelectedDispute(dispute);
        setLoading(true);
        const { getDocs, collection, query, orderBy } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');

        try {
            const [msgSnap, evSnap] = await Promise.all([
                getDocs(query(collection(db, "transactions", dispute.id, "messages"), orderBy("createdAt", "asc"))),
                getDocs(collection(db, "transactions", dispute.id, "evidence"))
            ]);

            setDisputeMessages(msgSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setDisputeEvidence(evSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error inspecting dispute:", error);
        }
        setLoading(false);
    };

    const handleResolveDispute = async (txId: string, result: 'release' | 'refund') => {
        const { releaseFunds } = await import('../lib/transactions');
        const { httpsCallable, getFunctions } = await import('firebase/functions');
        const functions = getFunctions();

        setIsUpdating(txId);
        try {
            let res;
            if (result === 'release') {
                res = await releaseFunds(txId);
            } else {
                const refund = httpsCallable(functions, 'refundFunds');
                const callRes = await refund({ transactionId: txId });
                res = callRes.data as any;
            }

            if (res.success) {
                notify({ type: 'success', title: 'Disputa Resuelta', message: `Fondos ${result === 'release' ? 'liberados' : 'reembolsados'}.`, icon: 'gavel' });
                setDisputes(prev => prev.filter(d => d.id !== txId));
            } else {
                notify({ type: 'error', title: 'Error', message: res.error || 'No se pudo resolver la disputa.', icon: 'error' });
            }
        } catch (error) {
            console.error(error);
        }
        setIsUpdating(null);
    };

    const handleToggleBadge = async (uid: string, badge: 'identityVerified' | 'addressVerified' | 'phoneVerified', currentVal: boolean) => {
        setIsUpdating(uid);
        const result = await updateUserVerification(uid, { [badge]: !currentVal });

        if (result.success) {
            notify({ type: 'success', title: 'Verificación Actualizada', message: 'Estado modificado exitosamente.', icon: 'verified' });
            setUsers(prev => prev.map(u => u.uid === uid ? {
                ...u,
                verificationBadges: { ...(u.verificationBadges || {}), [badge]: !currentVal }
            } : u));
            if (selectedUser?.uid === uid) {
                setSelectedUser(prev => prev ? {
                    ...prev,
                    verificationBadges: { ...(prev.verificationBadges || {}), [badge]: !currentVal }
                } : null);
            }
        }
        setIsUpdating(null);
    };

    const handleChangeRole = async (uid: string, newRole: 'admin' | 'moderator' | 'user') => {
        if (uid === user?.uid && newRole !== 'admin') {
            notify({ type: 'warning', title: 'Acción Restringida', message: 'No puedes degradar tu propio estatus administrativo.', icon: 'warning' });
            return;
        }

        setIsUpdating(uid);
        const result = await updateUserRole(uid, newRole);
        if (result.success) {
            notify({ type: 'success', title: 'Rol Actualizado', message: `Estatus del usuario cambiado a ${newRole.toUpperCase()}.`, icon: 'person' });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        }
        setIsUpdating(null);
    };

    const handleUpdateWallet = async (uid: string, balances: Partial<UserProfile['wallet']>) => {
        setIsUpdating(uid);
        const result = await updateUserWallet(uid, balances);
        if (result.success) {
            notify({ type: 'success', title: 'Libro Contable Sincronizado', message: 'Saldos de billetera ajustados con éxito.', icon: 'account_balance_wallet' });
            setUsers(prev => prev.map(u => u.uid === uid ? {
                ...u,
                wallet: { ...(u.wallet || { available: 0, inEscrow: 0, pending: 0, currency: 'ARS', lastUpdated: null }), ...balances }
            } : u));
            setSelectedUser(prev => prev && prev.uid === uid ? {
                ...prev,
                wallet: { ...(prev.wallet || { available: 0, inEscrow: 0, pending: 0, currency: 'ARS', lastUpdated: null }), ...balances }
            } : prev);
        }
        setIsUpdating(null);
    };

    const handleDeleteUser = async (uid: string) => {
        if (uid === user?.uid) {
            notify({ type: 'error', title: 'Error', message: 'Protocolo de auto-terminación restringido.', icon: 'error' });
            return;
        }

        if (!window.confirm('ADVERTENCIA: ¿Estás seguro de que deseas finalizar permanentemente el acceso de este usuario?')) return;

        setIsUpdating(uid);
        const result = await deleteUserByAdmin(uid);
        if (result.success) {
            notify({ type: 'success', title: 'Usuario Terminado', message: 'El acceso ha sido revocado.', icon: 'delete' });
            setUsers(prev => prev.filter(u => u.uid !== uid));
            setSelectedUser(null);
        }
        setIsUpdating(null);
    };

    if (loading) return <LoadingSpinner size="lg" text="Sincronizando Núcleo Administrativo..." />;

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-16 min-h-screen bg-light-50 pb-32">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16 px-2">
                <div>
                    <div className="inline-flex items-center gap-3 bg-dark-800 text-white px-4 py-2 rounded-xl mb-4 shadow-lg shadow-dark-800/10 scale-90 -ml-1">
                        <span className="material-symbols-outlined text-primary-vibrant text-sm">security</span>
                        <span className="text-[10px] font-black uppercase tracking-widest">Centro de Mando Administrativo</span>
                    </div>
                    <h1 className="text-5xl font-black text-dark-800 tracking-tighter uppercase mb-8">Hub de Infraestructura</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'users' ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-400 border border-light-200'}`}
                        >
                            Directorio de Nodos
                        </button>
                        <button
                            onClick={() => setActiveTab('finance')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'finance' ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-400 border border-light-200'}`}
                        >
                            Activos Globales
                        </button>
                        <button
                            onClick={() => setActiveTab('disputes')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'disputes' ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-400 border border-light-200'}`}
                        >
                            Tribunal de Disputas
                        </button>
                    </div>
                </div>

                {activeTab === 'users' && (
                    <div className="relative w-full lg:w-[450px] group shadow-premium rounded-3xl overflow-hidden">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-300 group-focus-within:text-primary-vibrant transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Filtrar por nombre, email o ID hash..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-none py-5 pl-14 pr-8 outline-none font-bold text-sm text-dark-800 placeholder:text-light-200"
                        />
                    </div>
                )}
            </div>

            {activeTab === 'users' ? (
                <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-dark-800 text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-10 py-8 border-b border-white/5">Nodo de Identidad</th>
                                    <th className="px-10 py-8 border-b border-white/5">Nivel de Acceso</th>
                                    <th className="px-10 py-8 border-b border-white/5 text-center">Estado del Protocolo</th>
                                    <th className="px-10 py-8 border-b border-white/5 text-right">Operaciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-100">
                                {filteredUsers.map((u) => (
                                    <tr key={u.uid} className={`hover:bg-light-50/50 transition-colors ${isUpdating === u.uid ? 'opacity-50 blur-[2px]' : ''}`}>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="relative">
                                                    <img
                                                        src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName)}&background=random`}
                                                        alt={u.displayName}
                                                        className="size-14 rounded-2xl object-cover border-2 border-white shadow-md"
                                                    />
                                                    {u.profileComplete && (
                                                        <div className="absolute -bottom-1 -right-1 size-5 bg-primary-vibrant rounded-full border-2 border-white flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-[10px] text-white font-black">check</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-dark-800 text-base mb-1 tracking-tight">{u.displayName}</p>
                                                    <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={u.role || 'user'}
                                                    onChange={(e) => handleChangeRole(u.uid, e.target.value as any)}
                                                    className="bg-light-100 border border-light-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary-100 transition-all cursor-pointer w-full"
                                                >
                                                    <option value="user">Operador</option>
                                                    <option value="moderator">Moderador</option>
                                                    <option value="admin">Administrador</option>
                                                </select>
                                                {u.verificationEvidence?.status === 'pending' && (
                                                    <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2 py-1 rounded-md border border-amber-200 animate-pulse text-center">
                                                        SOLICITUD KYC PENDIENTE
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex justify-center gap-2">
                                                {[
                                                    { key: 'identityVerified', title: 'ID' },
                                                    { key: 'addressVerified', title: 'ADDR' },
                                                    { key: 'phoneVerified', title: 'PH' }
                                                ].map(b => (
                                                    <div key={b.key} className={`size-2.5 rounded-full ${u.verificationBadges?.[b.key as keyof typeof u.verificationBadges] ? 'bg-primary-vibrant shadow-[0_0_10px_rgba(34,34,255,0.4)]' : 'bg-light-200'}`} title={b.title}></div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => setSelectedUser(u)}
                                                className="size-12 bg-white hover:bg-dark-800 text-dark-800 hover:text-white rounded-2xl transition-all shadow-sm border border-light-100 flex items-center justify-center group"
                                            >
                                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">monitoring</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'disputes' ? (
                <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="p-10 border-b border-light-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Colas de Arbitraje</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">Transacciones con protocolos de seguridad bloqueados por disputa.</p>
                        </div>
                        <div className="px-6 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                            {disputes.length} Casos Activos
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-light-50 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-10 py-6">ID Trato</th>
                                    <th className="px-10 py-6">Monto</th>
                                    <th className="px-10 py-6">Vendedor / Comprador</th>
                                    <th className="px-10 py-6 text-right">Resolución de Arbitraje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-100">
                                {disputes.map((d) => (
                                    <tr key={d.id} className={`hover:bg-light-50/50 transition-colors ${isUpdating === d.id ? 'opacity-50 blur-[2px]' : ''}`}>
                                        <td className="px-10 py-8 font-mono font-black text-xs text-primary-vibrant">#{d.id.slice(0, 8)}</td>
                                        <td className="px-10 py-8 font-black text-dark-800">${d.amount?.toLocaleString()}</td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] font-black text-dark-800 uppercase tracking-widest">V: {d.sellerId?.slice(0, 10)}...</p>
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">C: {d.buyerId?.slice(0, 10)}...</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => handleInspectDispute(d)}
                                                    className="size-12 bg-white hover:bg-dark-800 text-dark-800 hover:text-white rounded-2xl transition-all shadow-sm border border-light-100 flex items-center justify-center group"
                                                >
                                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">visibility</span>
                                                </button>
                                                <button
                                                    onClick={() => handleResolveDispute(d.id, 'refund')}
                                                    className="px-6 py-3 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                                                >
                                                    Fallo a favor del COMPRADOR
                                                </button>
                                                <button
                                                    onClick={() => handleResolveDispute(d.id, 'release')}
                                                    className="px-6 py-3 bg-primary-50 text-primary-vibrant rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-primary-vibrant hover:text-white transition-all shadow-sm border border-primary-100"
                                                >
                                                    Fallo a favor del VENDEDOR
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {disputes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-32 text-center">
                                            <div className="size-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <span className="material-symbols-outlined text-4xl">verified_user</span>
                                            </div>
                                            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No hay disputas activas en la red.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    {[
                        { label: 'Liquidez de Plataforma', val: stats?.totalAvailable, color: 'text-dark-800', icon: 'account_balance' },
                        { label: 'Reserva en Garantía', val: stats?.totalInEscrow, color: 'text-primary-vibrant', icon: 'lock_open' },
                        { label: 'Cola de Liquidación', val: stats?.totalPending, color: 'text-amber-500', icon: 'pending_actions' },
                        { label: 'Valor de Infraestructura Bruto', val: stats?.totalSystemValue, color: 'text-emerald-500', icon: 'monitoring' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-10 rounded-4xl border border-light-200 shadow-premium group hover:border-primary-100 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="size-12 bg-light-50 rounded-2xl flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                                    <span className={`material-symbols-outlined ${card.color} text-2xl font-black`}>{card.icon}</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">{card.label}</p>
                            <p className={`text-3xl font-black ${card.color} tracking-tighter`}>${card.val?.toLocaleString() || 0}</p>
                        </div>
                    ))}

                    <div className="lg:col-span-4 bg-dark-800 p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 size-80 bg-primary-vibrant/20 blur-[120px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40 mb-6 flex items-center gap-2">
                                    <span className="size-2 bg-primary-vibrant rounded-full animate-pulse"></span>
                                    Analíticas Globales del Sistema
                                </p>
                                <p className="text-7xl font-black tracking-tighter shadow-sm">${stats?.totalSystemValue?.toLocaleString() || 0}</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-3xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest transition-all">Generar Auditoría</button>
                                <button className="bg-primary-vibrant hover:scale-105 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20">Sincronización de Seguridad</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Inspection Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-dark-800/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-6xl rounded-[48px] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-500">
                        <button onClick={() => setSelectedUser(null)} className="absolute top-8 right-8 size-12 flex items-center justify-center bg-light-50 hover:bg-light-100 rounded-2xl transition-all z-20 shadow-sm border border-light-200 text-dark-800">
                            <span className="material-symbols-outlined font-black">close</span>
                        </button>

                        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
                            {/* Lateral Node Info */}
                            <div className="lg:col-span-4 bg-light-50 p-12 border-r border-light-200">
                                <div className="text-center mb-10">
                                    <img src={selectedUser.avatar} alt="" className="size-40 rounded-[40px] mx-auto mb-8 shadow-2xl border-4 border-white object-cover" />
                                    <h3 className="text-3xl font-black text-dark-800 mb-2 tracking-tighter">{selectedUser.displayName}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{selectedUser.email}</p>
                                    <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-light-200 text-[9px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
                                        UID de Nodo: {selectedUser.uid.slice(0, 12)}...
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-sm">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Ajuste de Activos</p>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[10px] font-black text-dark-800 uppercase tracking-widest">Disponible:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-200 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        value={selectedUser.wallet?.available || 0}
                                                        onChange={(e) => handleUpdateWallet(selectedUser.uid, { available: Number(e.target.value) })}
                                                        className="w-28 text-right bg-light-50 border-none rounded-xl px-4 py-2 font-black text-sm text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center group">
                                                <span className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest">En Garantía:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-200 font-bold">$</span>
                                                    <input
                                                        type="number"
                                                        value={selectedUser.wallet?.inEscrow || 0}
                                                        onChange={(e) => handleUpdateWallet(selectedUser.uid, { inEscrow: Number(e.target.value) })}
                                                        className="w-28 text-right bg-light-50 border-none rounded-xl px-4 py-2 font-black text-sm text-primary-vibrant outline-none focus:ring-2 focus:ring-primary-100 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Bank Details View */}
                                {selectedUser.bankDetails && (
                                    <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-sm mt-6">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">Datos de Pago (Vendedor)</p>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Banco</p>
                                                    <p className="text-xs font-black text-dark-800 truncate">{selectedUser.bankDetails.bankName || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Titular</p>
                                                    <p className="text-xs font-bold text-dark-800 truncate">{selectedUser.bankDetails.holderName || 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">CBU / CVU</p>
                                                <p className="text-[10px] font-mono font-bold text-dark-800 bg-light-50 p-3 rounded-xl block text-center tracking-widest">{selectedUser.bankDetails.cbu || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Alias</p>
                                                <p className="text-xs font-black text-primary-vibrant uppercase bg-primary-50/50 p-2 rounded-lg text-center">{selectedUser.bankDetails.alias || 'N/A'}</p>
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(
                                                            `Banco: ${selectedUser.bankDetails?.bankName}\nCBU: ${selectedUser.bankDetails?.cbu}\nAlias: ${selectedUser.bankDetails?.alias}\nTitular: ${selectedUser.bankDetails?.holderName}`
                                                        );
                                                        notify({ type: 'success', title: 'Copiado', message: 'Datos bancarios copiados al portapapeles.', icon: 'content_copy' });
                                                    }}
                                                    className="w-full py-3 rounded-xl bg-dark-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-dark-900 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                                    Copiar Datos
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        onClick={() => handleDeleteUser(selectedUser.uid)}
                                        className="w-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-red-200 active:scale-95 border-2 border-red-100"
                                    >
                                        Revocar Acceso de Nodo (Terminar)
                                    </button>
                                </div>
                            </div>

                            {/* Verification Evidence Inspection */}
                            <div className="lg:col-span-8 p-12">
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="size-12 bg-primary-vibrant rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                        <span className="material-symbols-outlined text-2xl font-black">verified</span>
                                    </div>
                                    <h4 className="text-2xl font-black text-dark-800 uppercase tracking-tight">Documentación de Evidencia</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                                    {[
                                        { key: 'dniFront', label: 'Frente del Documento de Identidad' },
                                        { key: 'dniBack', label: 'Dorso del Documento de Identidad' },
                                        { key: 'selfie', label: 'Selfie Biométrica' },
                                        { key: 'addressProof', label: 'Verificación de Residencia' }
                                    ].map(img => (
                                        <div key={img.key} className="group">
                                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4 ml-1">{img.label}</p>
                                            <div className="aspect-video bg-light-50 rounded-[32px] overflow-hidden border-2 border-dashed border-light-200 group-hover:border-primary-100 flex items-center justify-center transition-all bg-cover bg-center relative"
                                                style={{ backgroundImage: selectedUser.verificationEvidence?.[img.key as keyof typeof selectedUser.verificationEvidence] ? `none` : `none` }}>
                                                {selectedUser.verificationEvidence?.[img.key as keyof typeof selectedUser.verificationEvidence] ? (
                                                    <img
                                                        src={selectedUser.verificationEvidence[img.key as keyof typeof selectedUser.verificationEvidence] as string}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        alt={img.label}
                                                    />
                                                ) : (
                                                    <div className="text-center opacity-30">
                                                        <span className="material-symbols-outlined text-5xl mb-3">image_not_supported</span>
                                                        <p className="text-[9px] font-black uppercase tracking-widest">Sin evidencia cargada</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-dark-800/0 group-hover:bg-dark-800/20 transition-all"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-light-100">
                                    {[
                                        { key: 'identityVerified' as const, label: 'Autenticación de ID Estándar' },
                                        { key: 'addressVerified' as const, label: 'Dirección Postal Autorizada' }
                                    ].map(badge => (
                                        <button
                                            key={badge.key}
                                            onClick={() => handleToggleBadge(selectedUser.uid, badge.key, selectedUser.verificationBadges?.[badge.key] || false)}
                                            className={`flex-1 px-8 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${selectedUser.verificationBadges?.[badge.key]
                                                ? 'bg-primary-vibrant text-white shadow-primary-500/20 hover:opacity-90'
                                                : 'bg-light-50 text-gray-400 border border-light-200 hover:border-gray-300'}`}
                                        >
                                            <span className="material-symbols-outlined text-lg">
                                                {selectedUser.verificationBadges?.[badge.key] ? 'check_circle' : 'pending_actions'}
                                            </span>
                                            {badge.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispute Inspection Modal */}
            {
                selectedDispute && (
                    <div className="fixed inset-0 bg-dark-800/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-6xl rounded-[48px] shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-500">
                            <button onClick={() => setSelectedDispute(null)} className="absolute top-8 right-8 size-12 flex items-center justify-center bg-light-50 hover:bg-light-100 rounded-2xl transition-all z-20 shadow-sm border border-light-200 text-dark-800">
                                <span className="material-symbols-outlined font-black">close</span>
                            </button>

                            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
                                {/* Chat History */}
                                <div className="lg:col-span-5 bg-light-50 p-12 border-r border-light-200 flex flex-col h-full">
                                    <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight mb-8">Auditoría de Chat</h3>
                                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 pb-10">
                                        {disputeMessages.map((msg, idx) => (
                                            <div key={idx} className={`p-6 rounded-3xl ${msg.role === 'sistema' ? 'bg-amber-50 text-amber-700 border border-amber-100 mx-auto w-[90%] text-center' : 'bg-white border border-light-200 shadow-sm'}`}>
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">{msg.role} - {msg.createdAt?.toDate()?.toLocaleTimeString()}</p>
                                                <p className="text-sm font-bold text-dark-700 leading-relaxed">{msg.text}</p>
                                            </div>
                                        ))}
                                        {disputeMessages.length === 0 && <p className="text-center text-gray-400 py-20 uppercase font-black text-[10px]">Sin registros de chat</p>}
                                    </div>
                                </div>

                                {/* Evidence Gallery */}
                                <div className="lg:col-span-7 p-12">
                                    <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight mb-8">Evidencia de Transacción</h3>
                                    <div className="grid grid-cols-2 gap-6 mb-12">
                                        {disputeEvidence.map((ev, idx) => (
                                            <div key={idx} className="group relative">
                                                <img src={ev.url} className="aspect-video w-full rounded-3xl object-cover shadow-lg group-hover:scale-[1.02] transition-transform" />
                                                <div className="absolute inset-0 bg-dark-800/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center p-6 text-center">
                                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">{ev.type}: {ev.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {disputeEvidence.length === 0 && (
                                            <div className="col-span-2 py-32 bg-light-50 rounded-[40px] border-2 border-dashed border-light-200 flex flex-col items-center justify-center text-gray-300">
                                                <span className="material-symbols-outlined text-5xl mb-4">no_photography</span>
                                                <p className="text-[10px] font-black uppercase tracking-widest">Sin evidencia fotográfica</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-red-50 rounded-[40px] p-10 border border-red-100 flex flex-col gap-8">
                                        <div>
                                            <h4 className="text-lg font-black text-red-900 uppercase">Resolución del Juez</h4>
                                            <p className="text-sm font-bold text-red-700/70 mt-1">Como administrador, tu fallo es final y moverá los fondos de la cuenta de garantía global.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => handleResolveDispute(selectedDispute.id, 'refund')} className="flex-1 bg-white text-red-500 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest border border-red-200 shadow-xl hover:bg-red-500 hover:text-white transition-all active:scale-95">Fallar a favor del Comprador (Refund)</button>
                                            <button onClick={() => handleResolveDispute(selectedDispute.id, 'release')} className="flex-1 bg-primary-vibrant text-white py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-[1.02] transition-all active:scale-95">Fallar a favor del Vendedor (Liberar)</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
