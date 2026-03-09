import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { getAllUsers, updateUserVerification, updateUserRole, updateUserWallet, deleteUserByAdmin, getPlatformStats, suspendUser, getRecentTransactions, reviewUserEvidence } from '../lib/admin';
import { getReports, resolveReport, ReportData } from '../lib/interactions';
import { getPlatformSettings, updatePlatformSettings, PlatformSettings } from '../lib/settings';
import { UserProfile } from '../lib/users';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminReports from '../components/admin/AdminReports';

export default function AdminDashboard() {
    const { user, userProfile } = useAuth();
    const { notify } = useNotification();
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'finance' | 'disputes' | 'reports' | 'config' | 'operations'>('users');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [disputes, setDisputes] = useState<any[]>([]);
    const [reports, setReports] = useState<(ReportData & { id: string })[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<any | null>(null);
    const [disputeMessages, setDisputeMessages] = useState<any[]>([]);
    const [disputeEvidence, setDisputeEvidence] = useState<any[]>([]);
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [financialLogs, setFinancialLogs] = useState<any[]>([]);
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectionInput, setShowRejectionInput] = useState(false);

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
        const { getDisputedTransactions, getFinancialLogs, getWithdrawalRequests } = await import('../lib/admin');
        const [usersData, statsData, disputesData, settingsData, reportsData, logsData, withdrawalsData, salesData] = await Promise.all([
            getAllUsers(),
            getPlatformStats(),
            getDisputedTransactions(),
            getPlatformSettings(),
            getReports(),
            getFinancialLogs(),
            getWithdrawalRequests(),
            getRecentTransactions()
        ]);
        setUsers(usersData);
        setFilteredUsers(usersData);
        setStats(statsData);
        setDisputes(disputesData);
        setSettings(settingsData);
        setReports(reportsData);
        setFinancialLogs(logsData);
        setWithdrawals(withdrawalsData);
        setRecentSales(salesData);
        setLoading(false);
    };

    const handleResolveReport = async (report: ReportData & { id: string }, status: ReportData['status']) => {
        setIsUpdating(report.id);
        const result = await resolveReport(report.id, status, report.targetId, report.targetType);

        if (result.success) {
            const actionMsg = status === 'resolved' ? 'Publicación eliminada y reporte cerrado.' : 'Reporte descartado (Falsa Alarma).';
            notify({ type: 'success', title: 'Acción Completada', message: actionMsg, icon: status === 'resolved' ? 'delete' : 'verified_user' });
            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status } : r));
        } else {
            notify({ type: 'error', title: 'Error', message: 'No se pudo procesar la solicitud.', icon: 'error' });
        }
        setIsUpdating(null);
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
        const { releaseFunds, adminRefundFunds } = await import('../lib/transactions');

        setIsUpdating(txId);
        try {
            const res = result === 'release'
                ? await releaseFunds(txId)
                : await adminRefundFunds(txId, user?.uid || 'admin');

            if (res.success) {
                notify({ type: 'success', title: 'Disputa Resuelta', message: `Fondos ${result === 'release' ? 'liberados' : 'reembolsados'}.`, icon: 'gavel' });
                setDisputes(prev => prev.filter(d => d.id !== txId));
                setSelectedDispute(null);
            } else {
                notify({ type: 'error', title: 'Error', message: res.error || 'No se pudo resolver la disputa.', icon: 'error' });
            }
        } catch (error: any) {
            console.error(error);
            notify({ type: 'error', title: 'Fallo Crítico', message: error.message, icon: 'dangerous' });
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

        const targetUser = users.find(u => u.uid === uid);
        if (!window.confirm(`ADVERTENCIA: ¿Eliminar permanentemente a "${targetUser?.displayName || uid}"?\n\nSe borrará:\n• Items publicados\n• Chats y mensajes\n• Reseñas y preguntas\n• Movimientos de billetera\n• Retiros y reportes\n\nSolo se conservará el EMAIL.`)) return;

        const confirmKey = prompt('Escribe "ELIMINAR" para confirmar la eliminación total:');
        if (confirmKey !== 'ELIMINAR') return;

        setIsUpdating(uid);
        const result = await deleteUserByAdmin(uid);
        if (result.success) {
            const counts = (result as any).deletedCounts;
            notify({
                type: 'success',
                title: 'Usuario Eliminado',
                message: `Data eliminada: ${counts?.items || 0} items, ${counts?.chats || 0} chats, ${counts?.reviews || 0} reseñas, ${counts?.movements || 0} movimientos. Email preservado.`,
                icon: 'delete_forever'
            });
            setUsers(prev => prev.filter(u => u.uid !== uid));
            setSelectedUser(null);
        } else {
            notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar al usuario.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleSuspendUser = async (uid: string, isSuspended: boolean) => {
        if (uid === user?.uid) {
            notify({ type: 'error', title: 'Error', message: 'No puedes suspender tu propia cuenta.', icon: 'error' });
            return;
        }
        setIsUpdating(uid);
        const actionMsg = isSuspended ? 'Suspender' : 'Reactivar';
        if (!window.confirm(`¿${actionMsg} esta cuenta?`)) {
            setIsUpdating(null);
            return;
        }

        const result = await suspendUser(uid, isSuspended);
        if (result.success) {
            notify({ type: 'success', title: `Usuario ${isSuspended ? 'Suspendido' : 'Reactivado'}`, message: 'Estado del nodo actualizado.', icon: isSuspended ? 'block' : 'check_circle' });
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isSuspended } : u));
            setSelectedUser(prev => prev && prev.uid === uid ? { ...prev, isSuspended } : prev);
        } else {
            notify({ type: 'error', title: 'Error', message: 'No se pudo alterar el estado del usuario.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleUpdateSettings = async (newSettings: Partial<PlatformSettings>) => {
        setIsUpdating('settings');
        const result = await updatePlatformSettings(newSettings);
        if (result.success) {
            setSettings(prev => prev ? { ...prev, ...newSettings } : null);
            notify({ type: 'success', title: 'Configuración Guardada', message: 'Los parámetros del sistema han sido actualizados.', icon: 'save_as' });
        } else {
            notify({ type: 'error', title: 'Error de Guardado', message: 'No se pudo actualizar la configuración.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleClearWalletMovements = async () => {
        if (!window.confirm('¿ELIMINAR TODOS LOS MOVIMIENTOS? Esta acción no se puede deshacer.')) return;
        if (!window.confirm('CONFIRMACIÓN FINAL: Se borrarán todos los registros de activos en la red.')) return;

        setIsUpdating('dev-tools');
        const { clearAllWalletMovements } = await import('../lib/admin');
        const result = await clearAllWalletMovements();
        if (result.success) {
            notify({ type: 'success', title: 'Limpieza Completada', message: 'Historial de movimientos eliminado.', icon: 'delete_sweep' });
            loadData();
        } else {
            notify({ type: 'error', title: 'Fallo', message: 'No se pudo limpiar la base de datos.', icon: 'error' });
        }
        setIsUpdating(null);
    };

    const handleResetReputations = async () => {
        if (!window.confirm('¿RESETEAR TODAS LAS REPUTACIONES? Todos los vendedores volverán a 0 estrellas.')) return;
        if (!window.confirm('CONFIRMACIÓN FINAL: Se borrarán todas las reseñas y promedios de la plataforma.')) return;

        setIsUpdating('dev-tools');
        const { resetAllUserReputations } = await import('../lib/admin');
        const result = await resetAllUserReputations();
        if (result.success) {
            notify({ type: 'success', title: 'Reputaciones Reseteadas', message: 'Rankings vueltos a origen.', icon: 'star_outline' });
            loadData();
        } else {
            notify({ type: 'error', title: 'Fallo', message: 'No se pudo resetear el ranking.', icon: 'error' });
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
                            onClick={() => setActiveTab('operations')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'operations' ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-400 border border-light-200'}`}
                        >
                            Operaciones
                        </button>
                        <button
                            onClick={() => setActiveTab('disputes')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'disputes' ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-400 border border-light-200'}`}
                        >
                            Tribunal de Disputas
                        </button>
                        <button
                            onClick={() => setActiveTab('reports')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'reports' ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-400 border border-light-200'}`}
                        >
                            Denuncias
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'config' ? 'bg-primary-vibrant text-white shadow-xl shadow-primary-500/20' : 'bg-white text-gray-400 border border-light-200'}`}
                        >
                            Configuración
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
            ) : activeTab === 'operations' ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <AdminReports />

                    <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden">
                        <div className="p-10 border-b border-light-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Registro de Operaciones</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1">Transacciones recientes en tiempo real.</p>
                            </div>
                            <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                {recentSales.length} Últimas Ventas
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-light-50 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-10 py-6">ID / Fecha</th>
                                        <th className="px-10 py-6">Vendedor</th>
                                        <th className="px-10 py-6">Comprador</th>
                                        <th className="px-10 py-6 text-center">Estado</th>
                                        <th className="px-10 py-6 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-100">
                                    {recentSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-light-50/50 transition-colors">
                                            <td className="px-10 py-6">
                                                <p className="font-mono font-black text-xs text-dark-800">#{sale.id.slice(0, 8)}</p>
                                                <p className="text-[9px] font-bold text-gray-400 mt-1">{sale.createdAt?.toDate?.()?.toLocaleString('es-AR')}</p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="text-[10px] font-black text-dark-800 tracking-widest">{sale.sellerId?.slice(0, 10)}...</p>
                                            </td>
                                            <td className="px-10 py-6">
                                                <p className="text-[10px] font-black text-gray-400 tracking-widest">{sale.buyerId?.slice(0, 10)}...</p>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${sale.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                    sale.status === 'DISPUTED' ? 'bg-red-50 text-red-600' :
                                                        sale.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <p className="font-black text-dark-800 text-sm">${sale.amount?.toLocaleString()}</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {recentSales.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-20 text-center">
                                                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No hay operaciones recientes.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
            ) : activeTab === 'reports' ? (
                <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="p-10 border-b border-light-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Centro de Denuncias</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">Gestión de contenido reportado por la comunidad.</p>
                        </div>
                        <div className="px-6 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                            {reports.filter(r => r.status === 'pending').length} Pendientes
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-light-50 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-10 py-6">Tipo</th>
                                    <th className="px-10 py-6">Denunciante</th>
                                    <th className="px-10 py-6">Motivo</th>
                                    <th className="px-10 py-6 text-center">Estado</th>
                                    <th className="px-10 py-6 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-light-100">
                                {reports.map((report) => (
                                    <tr key={report.id} className={`hover:bg-light-50/50 transition-colors ${isUpdating === report.id ? 'opacity-50 blur-[2px]' : ''}`}>
                                        <td className="px-10 py-8">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${report.targetType === 'product' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                {report.targetType === 'product' ? 'Producto' : 'Usuario'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-bold text-dark-800 text-sm">{report.reporterName}</p>
                                            <p className="text-[10px] font-mono text-gray-400 mt-1">{report.reporterId.slice(0, 8)}...</p>
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="font-black text-dark-800 text-xs uppercase tracking-tight">{report.reason}</p>
                                            <p className="text-[10px] text-gray-400 mt-1 max-w-xs">{report.description}</p>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${report.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                                                report.status === 'dismissed' ? 'bg-gray-100 text-gray-500' :
                                                    'bg-amber-50 text-amber-600 animate-pulse'
                                                }`}>
                                                {report.status === 'pending' ? 'Pendiente' :
                                                    report.status === 'resolved' ? 'Resuelto' :
                                                        report.status === 'dismissed' ? 'Descartado' : report.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            {report.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleResolveReport(report, 'dismissed')}
                                                        className="h-10 px-4 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-200 hover:text-dark-800 transition-all flex items-center gap-2 border border-gray-100"
                                                        title="Denuncia Falsa (Mantener)"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">Descartar</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleResolveReport(report, 'resolved')}
                                                        className="h-10 px-4 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 border border-red-100"
                                                        title="Denuncia Cierta (Eliminar)"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                        <span className="text-[9px] font-black uppercase tracking-widest hidden lg:inline">Eliminar</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {reports.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-32 text-center">
                                            <div className="size-20 bg-light-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                                <span className="material-symbols-outlined text-4xl text-gray-300">notifications_off</span>
                                            </div>
                                            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No hay denuncias activas.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : activeTab === 'config' ? (
                <div className="bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700 p-12">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="size-16 bg-dark-800 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-dark-800/20">
                            <span className="material-symbols-outlined text-3xl font-black animate-spin-slow">settings</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-dark-800 uppercase tracking-tight">Variables de Entorno Global</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">Modifica los parámetros operativos de todo el marketplace en tiempo real.</p>
                        </div>
                    </div>

                    <div className="max-w-2xl">
                        <div className="bg-light-50 p-10 rounded-[40px] border border-light-200 shadow-inner">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-lg font-black text-dark-800 uppercase tracking-tight mb-2">Comisión de Escrow (Base)</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                                        Porcentaje aplicado sobre el valor del ítem para cubrir costos de garantía y operación de plataforma.
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-4xl font-black text-primary-vibrant tracking-tighter">
                                        {((settings?.escrowFeePercentage || 0) * 100).toFixed(0)}%
                                    </p>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Valor Actual</p>
                                </div>
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-3">Ajustar Porcentaje Base (0.01 - 1.00)</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={settings?.escrowFeePercentage || 0}
                                            onChange={(e) => setSettings(prev => prev ? { ...prev, escrowFeePercentage: parseFloat(e.target.value) } : null)}
                                            className="flex-1 bg-white border border-light-200 rounded-2xl px-6 py-4 font-black text-lg outline-none focus:ring-4 focus:ring-primary-100 transition-all text-center"
                                        />
                                        <button
                                            onClick={() => settings && handleUpdateSettings({ escrowFeePercentage: settings.escrowFeePercentage })}
                                            disabled={isUpdating === 'settings'}
                                            className="px-8 bg-dark-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                        >
                                            {isUpdating === 'settings' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">save</span>}
                                            Guardar
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-light-200/50">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h4 className="text-lg font-black text-primary-vibrant uppercase tracking-tight mb-2">Extra por "Oferta Relámpago"</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                                                Comisión adicional aplicada si el vendedor decide destacar su producto en la portada.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-primary-vibrant tracking-tighter">
                                                +{((settings?.featuredExtraPercentage || 0) * 100).toFixed(0)}%
                                            </p>
                                            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-1">Valor Actual</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mb-6">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-3">Porcentaje Extra (0.01 - 0.50)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="0.5"
                                                value={settings?.featuredExtraPercentage || 0}
                                                onChange={(e) => setSettings(prev => prev ? { ...prev, featuredExtraPercentage: parseFloat(e.target.value) } : null)}
                                                className="w-full bg-white border border-light-200 rounded-2xl px-6 py-4 font-black text-lg outline-none focus:ring-4 focus:ring-primary-100 transition-all text-center"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-3">Duración (Horas)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="168"
                                                value={settings?.featuredDurationHours || 48}
                                                onChange={(e) => setSettings(prev => prev ? { ...prev, featuredDurationHours: parseInt(e.target.value) } : null)}
                                                className="w-full bg-white border border-light-200 rounded-2xl px-6 py-4 font-black text-lg outline-none focus:ring-4 focus:ring-primary-100 transition-all text-center"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => settings && handleUpdateSettings({
                                                    featuredExtraPercentage: settings.featuredExtraPercentage,
                                                    featuredDurationHours: settings.featuredDurationHours
                                                })}
                                                disabled={isUpdating === 'settings'}
                                                className="h-[60px] px-8 bg-primary-vibrant text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                            >
                                                {isUpdating === 'settings' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">lock_reset</span>}
                                                Aplicar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-primary-50 p-6 rounded-3xl border border-primary-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-primary-800 uppercase tracking-widest">Total Destacados:</span>
                                            <span className="text-2xl font-black text-primary-vibrant">
                                                {(((settings?.escrowFeePercentage || 0) + (settings?.featuredExtraPercentage || 0)) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-light-200/50 grid grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-light-200">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Ejemplo: Ítem $10.000</p>
                                        <p className="text-xl font-black text-dark-800">${(10000 * (settings?.escrowFeePercentage || 0)).toLocaleString()}</p>
                                        <p className="text-[8px] text-primary-vibrant font-black uppercase tracking-widest">Fee de Plataforma</p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-light-200">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Ejemplo: Ítem $150.000</p>
                                        <p className="text-xl font-black text-dark-800">${(150000 * (settings?.escrowFeePercentage || 0)).toLocaleString()}</p>
                                        <p className="text-[8px] text-primary-vibrant font-black uppercase tracking-widest">Fee de Plataforma</p>
                                    </div>
                                </div>
                            </div>

                            {/* DEV TOOLS SECTION */}
                            <div className="mt-16 pt-10 border-t border-light-200">
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="material-symbols-outlined text-red-500 font-black">engineering</span>
                                    <h4 className="text-lg font-black text-dark-800 uppercase tracking-tight">Herramientas de Desarrollo (DANGER ZONE)</h4>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-red-50 p-8 rounded-[32px] border border-red-100">
                                        <h5 className="text-[11px] font-black text-red-900 uppercase tracking-widest mb-3">Limpiar Libro Mayor</h5>
                                        <p className="text-[9px] font-bold text-red-700/60 uppercase tracking-widest leading-relaxed mb-6">
                                            Elimina permanentemente todos los registros de movimientos en las billeteras.
                                        </p>
                                        <button
                                            onClick={handleClearWalletMovements}
                                            disabled={isUpdating !== null}
                                            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {isUpdating === 'dev-tools' ? 'Procesando...' : 'Eliminar Movimientos'}
                                        </button>
                                    </div>
                                    <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-100">
                                        <h5 className="text-[11px] font-black text-amber-900 uppercase tracking-widest mb-3">Resetear Rankings</h5>
                                        <p className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest leading-relaxed mb-6">
                                            Limpia las reseñas y reputaciones de todos los usuarios de la red.
                                        </p>
                                        <button
                                            onClick={handleResetReputations}
                                            disabled={isUpdating !== null}
                                            className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {isUpdating === 'dev-tools' ? 'Procesando...' : 'Resetear Vendedores'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    {[
                        { label: 'Liquidez de Plataforma', val: stats?.totalAvailable, color: 'text-dark-800', icon: 'account_balance' },
                        { label: 'Ventas del Día', val: stats?.dailySales, color: 'text-primary-vibrant', icon: 'point_of_sale' },
                        { label: 'Tratos en Garantía', val: stats?.totalInEscrow, color: 'text-dark-800', icon: 'lock_open' },
                        { label: 'Nuevos Usuarios (Hoy)', val: stats?.newUsersToday, color: 'text-amber-500', icon: 'person_add' },
                        { label: 'Cola de Liquidación', val: stats?.totalPending, color: 'text-orange-500', icon: 'pending_actions' },
                        { label: 'Valor de Infraestructura Bruto', val: stats?.totalSystemValue, color: 'text-emerald-500', icon: 'monitoring' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-6 rounded-4xl border border-light-200 shadow-premium group hover:border-primary-100 transition-all">
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
                                <button
                                    onClick={async () => {
                                        setIsUpdating('audit');
                                        const { generateAuditReport } = await import('../lib/admin');
                                        const res = await generateAuditReport();
                                        if (res.success) {
                                            notify({ type: 'success', title: 'Auditoría Generada', message: `Reporte descargado. ${res.report?.totalUsers} usuarios, ${res.report?.totalTransactions} transacciones, ${res.report?.totalItems} items analizados.`, icon: 'download_done' });
                                        } else {
                                            notify({ type: 'error', title: 'Error', message: 'No se pudo generar la auditoría.', icon: 'error' });
                                        }
                                        setIsUpdating(null);
                                    }}
                                    disabled={isUpdating !== null}
                                    className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-3xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdating === 'audit' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">summarize</span>}
                                    Generar Auditoría
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsUpdating('sync');
                                        const { runSecuritySync } = await import('../lib/admin');
                                        const res = await runSecuritySync();
                                        if (res.success) {
                                            const issueCount = res.issues?.length || 0;
                                            const fixedCount = res.fixed || 0;
                                            if (issueCount === 0) {
                                                notify({ type: 'success', title: 'Sistema Seguro', message: `${res.totalScanned} registros escaneados. Sin anomalías detectadas.`, icon: 'verified_user' });
                                            } else {
                                                notify({ type: 'warning', title: `${issueCount} Anomalía(s) Detectada(s)`, message: `${fixedCount} auto-corregidas. Detalles:\n${res.issues?.slice(0, 5).join('\n')}${issueCount > 5 ? `\n...y ${issueCount - 5} más` : ''}`, icon: 'shield' });
                                            }
                                            loadData(); // Refresh data after sync
                                        } else {
                                            notify({ type: 'error', title: 'Error', message: 'Fallo en la sincronización de seguridad.', icon: 'error' });
                                        }
                                        setIsUpdating(null);
                                    }}
                                    disabled={isUpdating !== null}
                                    className="bg-primary-vibrant hover:scale-105 px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isUpdating === 'sync' ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">security</span>}
                                    Sincronización de Seguridad
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Fiscal History Table (SUDO) */}
                    <div className="lg:col-span-4 bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden mt-8 animate-in fade-in duration-1000">
                        <div className="p-10 border-b border-light-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Libro Mayor de Ingresos (SUDO)</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1">Historial de comisiones, penalizaciones y movimientos de plataforma.</p>
                            </div>
                            <div className="size-12 bg-primary-50 text-primary-vibrant rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined font-black">receipt_long</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-light-50/50 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-10 py-6">Operación</th>
                                        <th className="px-10 py-6">Transacción</th>
                                        <th className="px-10 py-6">Monto</th>
                                        <th className="px-10 py-6">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-100">
                                    {(financialLogs || []).map((log: any) => (
                                        <tr key={log.id} className="hover:bg-light-50/50 transition-colors">
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <span className={`size-2 rounded-full ${log.type === 'platform_fee' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                    <p className="text-[10px] font-black text-dark-800 uppercase tracking-widest">
                                                        {log.type === 'platform_fee' ? 'Comisión Venta' : 'Penalización Cancelación'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 font-mono text-[10px] text-gray-400">#{log.transactionId.slice(0, 8).toUpperCase()}</td>
                                            <td className="px-10 py-6 font-black text-dark-800 text-sm">${log.amount?.toLocaleString()}</td>
                                            <td className="px-10 py-6 text-[10px] font-bold text-gray-300">
                                                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('es-AR') : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!financialLogs || financialLogs.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-10 py-20 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
                                                No hay registros fiscales disponibles aún.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Withdrawal Requests Table (SUDO) */}
                    <div className="lg:col-span-4 bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden mt-8 animate-in fade-in duration-1000">
                        <div className="p-10 border-b border-light-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-dark-800 uppercase tracking-tight">Solicitudes de Retiro</h3>
                                <p className="text-xs font-bold text-gray-400 mt-1">Órdenes de transferencia bancaria pendientes de procesamiento.</p>
                            </div>
                            <div className="size-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <span className="material-symbols-outlined font-black">account_balance</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-light-50/50 text-gray-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                        <th className="px-10 py-6">Usuario</th>
                                        <th className="px-10 py-6">Monto</th>
                                        <th className="px-10 py-6">Datos Bancarios</th>
                                        <th className="px-10 py-6">Estado</th>
                                        <th className="px-10 py-6">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-100">
                                    {(withdrawals || []).map((req: any) => (
                                        <tr key={req.id} className="hover:bg-light-50/50 transition-colors">
                                            <td className="px-10 py-6">
                                                <p className="text-xs font-black text-dark-800">{req.uid.slice(0, 8).toUpperCase()}</p>
                                            </td>
                                            <td className="px-10 py-6 font-black text-dark-800 text-sm">${req.amount.toLocaleString()}</td>
                                            <td className="px-10 py-6">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                                                    {req.bankDetails?.bankName} <br />
                                                    CBU: {req.bankDetails?.cbu}
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${req.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                    req.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {req.status === 'completed' ? 'Completado' : req.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('¿Confirmar que la transferencia fue realizada?')) {
                                                                    const { updateWithdrawalStatus } = await import('../lib/admin');
                                                                    const res = await updateWithdrawalStatus(req.id, 'completed');
                                                                    if (res.success) loadData();
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                if (confirm('¿Rechazar solicitud de retiro?')) {
                                                                    const { updateWithdrawalStatus } = await import('../lib/admin');
                                                                    const res = await updateWithdrawalStatus(req.id, 'rejected');
                                                                    if (res.success) loadData();
                                                                }
                                                            }}
                                                            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!withdrawals || withdrawals.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-10 py-20 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">
                                                No hay solicitudes de retiro pendientes.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="lg:col-span-4 bg-rose-50/30 rounded-[40px] border border-rose-100 p-10 mt-12 animate-in slide-in-from-bottom-10 duration-1000">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                                <span className="material-symbols-outlined font-black">warning</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-rose-600 uppercase tracking-tight">Zona de Peligro</h3>
                                <p className="text-xs font-bold text-rose-400">Acciones destructivas e irreversibles.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white p-8 rounded-[32px] border border-rose-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-dark-800">Eliminar Todos los Productos</p>
                                    <p className="text-[10px] font-bold text-gray-400 max-w-[280px] mt-1">Borra permanentemente todos los ítems de la base de datos.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const confirmKey = prompt('ESTO ELIMINARÁ TODO EL MARKETPLACE. Escribe "BORRAR TODO" para confirmar:');
                                        if (confirmKey === 'BORRAR TODO') {
                                            const { clearAllItems } = await import('../lib/admin');
                                            const res = await clearAllItems();
                                            if (res.success) {
                                                alert(`Éxito: Se eliminaron ${res.count} productos.`);
                                                loadData();
                                            } else {
                                                alert('Error: ' + res.error);
                                            }
                                        }
                                    }}
                                    className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/10"
                                >
                                    Ejecutar Limpieza
                                </button>
                            </div>

                            <div className="bg-white p-8 rounded-[32px] border border-rose-100 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-black text-dark-800">Eliminar Historial Financiero</p>
                                    <p className="text-[10px] font-bold text-gray-400 max-w-[280px] mt-1">Borra transacciones, retiros y registros fiscales.</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        const confirmKey = prompt('ESTO ELIMINARÁ TODO EL HISTORIAL FINANCIERO. Escribe "BORRAR HISTORIAL" para confirmar:');
                                        if (confirmKey === 'BORRAR HISTORIAL') {
                                            const { clearAllTransactionsHistory } = await import('../lib/admin');
                                            const res = await clearAllTransactionsHistory();
                                            if (res.success) {
                                                alert(`Éxito: Se eliminaron ${res.count} registros.`);
                                                loadData();
                                            } else {
                                                alert('Error: ' + res.error);
                                            }
                                        }
                                    }}
                                    className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/10"
                                >
                                    Borrar Historial
                                </button>
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

                                <div className="pt-4 flex flex-col xl:flex-row gap-4">
                                    <button
                                        onClick={() => handleSuspendUser(selectedUser.uid, !selectedUser.isSuspended)}
                                        className={`flex-1 py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 border-2 ${selectedUser.isSuspended
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-200'
                                            : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-500 hover:text-white hover:shadow-amber-200'
                                            }`}
                                    >
                                        {selectedUser.isSuspended ? 'Reactivar Usuario' : 'Suspender Usuario'}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(selectedUser.uid)}
                                        className="flex-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-red-200 active:scale-95 border-2 border-red-100"
                                    >
                                        Terminar Nodo
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
                                            <div className="aspect-video bg-light-50 rounded-[32px] overflow-hidden border-2 border-dashed border-light-200 group-hover:border-primary-100 flex items-center justify-center transition-all bg-cover bg-center relative cursor-zoom-in"
                                                onClick={() => selectedUser.verificationEvidence?.[img.key as keyof typeof selectedUser.verificationEvidence] && setZoomedImage(selectedUser.verificationEvidence[img.key as keyof typeof selectedUser.verificationEvidence] as string)}
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
                                                <div className="absolute inset-0 bg-dark-800/0 group-hover:bg-dark-800/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <span className="material-symbols-outlined text-white text-3xl font-black">zoom_in</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedUser.verificationEvidence?.submittedAt && (
                                    <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Verificación</p>
                                                <p className={`text-sm font-black mt-1 ${selectedUser.verificationEvidence.status === 'approved' ? 'text-emerald-600' :
                                                    selectedUser.verificationEvidence.status === 'rejected' ? 'text-rose-600' :
                                                        selectedUser.verificationEvidence.status === 'pending' ? 'text-amber-600' : 'text-slate-400'
                                                    }`}>
                                                    {selectedUser.verificationEvidence.status === 'approved' ? 'DOCUMENTACIÓN APROBADA' :
                                                        selectedUser.verificationEvidence.status === 'rejected' ? 'DOCUMENTACIÓN RECHAZADA' :
                                                            selectedUser.verificationEvidence.status === 'pending' ? 'PENDIENTE DE REVISIÓN' : 'SIN ENVÍOS'
                                                    }
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Enviado el</p>
                                                <p className="text-[10px] font-bold text-slate-600 mt-1">
                                                    {selectedUser.verificationEvidence.submittedAt?.toDate ? selectedUser.verificationEvidence.submittedAt.toDate().toLocaleString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>

                                        {showRejectionInput ? (
                                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    placeholder="Motivo del rechazo (ej: Foto borrosa, DNI vencido...)"
                                                    className="w-full bg-white border border-rose-100 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20"
                                                    rows={3}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setShowRejectionInput(false)}
                                                        className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (!rejectionReason) return notify({ type: 'warning', title: 'Atención', message: 'Debes ingresar un motivo.', icon: 'warning' });
                                                            setIsUpdating('kyc');
                                                            const res = await reviewUserEvidence(selectedUser.uid, 'rejected', rejectionReason);
                                                            if (res.success) {
                                                                notify({ type: 'success', title: 'Actualizado', message: 'Documentación rechazada.', icon: 'close' });
                                                                setSelectedUser({ ...selectedUser, verificationEvidence: { ...selectedUser.verificationEvidence!, status: 'rejected', rejectionReason } });
                                                                setShowRejectionInput(false);
                                                                setRejectionReason('');
                                                                loadData();
                                                            }
                                                            setIsUpdating(null);
                                                        }}
                                                        className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
                                                    >
                                                        Confirmar Rechazo
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => setShowRejectionInput(true)}
                                                    className="flex-1 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    Rechazar Evidencia
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        setIsUpdating('kyc');
                                                        const res = await reviewUserEvidence(selectedUser.uid, 'approved');
                                                        if (res.success) {
                                                            notify({ type: 'success', title: 'Éxito', message: 'Usuario verificado correctamente.', icon: 'verified' });
                                                            setSelectedUser({
                                                                ...selectedUser,
                                                                verificationEvidence: { ...selectedUser.verificationEvidence!, status: 'approved' },
                                                                verificationBadges: { ...selectedUser.verificationBadges, identityVerified: true }
                                                            });
                                                            loadData();
                                                        }
                                                        setIsUpdating(null);
                                                    }}
                                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                                                >
                                                    Aprobar Identidad
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-light-100 mt-8">
                                    {[
                                        { key: 'identityVerified' as const, label: 'Badge Identidad' },
                                        { key: 'addressVerified' as const, label: 'Badge Dirección' },
                                        { key: 'phoneVerified' as const, label: 'Badge Teléfono' }
                                    ].map(badge => (
                                        <button
                                            key={badge.key}
                                            onClick={() => handleToggleBadge(selectedUser.uid, badge.key, selectedUser.verificationBadges?.[badge.key] || false)}
                                            className={`flex-1 px-8 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 ${selectedUser.verificationBadges?.[badge.key]
                                                ? 'bg-primary-vibrant text-white shadow-primary-500/20 hover:opacity-90'
                                                : 'bg-light-50 text-gray-400 border border-light-200 hover:border-gray-300'}`}
                                        >
                                            <span className="material-symbols-outlined text-base">
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
                                    <div className="mb-10 p-6 bg-red-600 rounded-3xl text-white shadow-xl shadow-red-600/20">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Motivo del Reclamo (Protocolo)</p>
                                        <p className="text-sm font-black italic">"{selectedDispute.disputeReason || 'No especificado por el usuario'}"</p>
                                    </div>
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
                                            <div key={idx} className="group relative cursor-zoom-in" onClick={() => setZoomedImage(ev.url)}>
                                                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-light-200 bg-light-50 shadow-sm transition-all group-hover:shadow-xl group-hover:border-primary-200">
                                                    <img src={ev.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                </div>
                                                <div className="absolute inset-0 bg-dark-800/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                                                    <span className="material-symbols-outlined text-white text-3xl mb-2">zoom_in</span>
                                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">{ev.type}</p>
                                                    <p className="text-white/60 text-[8px] font-bold uppercase mt-1 line-clamp-2">{ev.description}</p>
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
            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 bg-dark-950/95 backdrop-blur-3xl z-[300] flex items-center justify-center p-8 lg:p-20 animate-in fade-in duration-300"
                    onClick={() => setZoomedImage(null)}
                >
                    <button className="absolute top-10 right-10 size-16 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-all">
                        <span className="material-symbols-outlined text-3xl font-black">close</span>
                    </button>
                    <img
                        src={zoomedImage}
                        className="max-w-full max-h-full rounded-[40px] shadow-[0_0_100px_rgba(34,34,255,0.2)] object-contain animate-in zoom-in-95 duration-500"
                        alt="Zoomed Evidence"
                    />
                </div>
            )}
        </div>
    );
}
