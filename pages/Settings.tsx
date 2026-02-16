import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { updateUserProfile, deleteUserAccount } from '../lib/users';
import { uploadFile } from '../lib/storage';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Settings() {
    const navigate = useNavigate();
    const { user, userProfile, refreshProfile, logout } = useAuth();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        phone: '',
        city: '',
        state: '',
        avatar: '',
        coverImage: '',
        cbu: '',
        alias: '',
        bankName: '',
        holderName: '',
        accountType: 'Caja de Ahorro',
    });

    const [previews, setPreviews] = useState({
        avatar: '',
        coverImage: '',
    });

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || '',
                bio: userProfile.bio || '',
                phone: userProfile.phone || '',
                city: userProfile.location?.city || '',
                state: userProfile.location?.state || '',
                avatar: userProfile.avatar || '',
                coverImage: userProfile.coverImage || '',
                cbu: userProfile.bankDetails?.cbu || '',
                alias: userProfile.bankDetails?.alias || '',
                bankName: userProfile.bankDetails?.bankName || '',
                holderName: userProfile.bankDetails?.holderName || '',
                accountType: userProfile.bankDetails?.accountType || 'Caja de Ahorro',
            });
            setPreviews({
                avatar: userProfile.avatar || '',
                coverImage: userProfile.coverImage || '',
            });
        }
    }, [userProfile]);

    if (!user || !userProfile) {
        return <LoadingSpinner text="Sincronizando Protocolos..." />;
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview locally
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
        };
        reader.readAsDataURL(file);

        // Upload to storage
        setIsSaving(true);
        try {
            const path = `profiles / ${user.uid}/${type}_${Date.now()}`;
            const url = await uploadFile(file, path);
            setFormData(prev => ({ ...prev, [type]: url }));
            notify({ type: 'success', title: 'Imagen Cargada', message: 'Se ha sincronizado la nueva imagen.', icon: 'image' });
        } catch (error) {
            notify({ type: 'error', title: 'Error de Carga', message: 'No se pudo subir la imagen.', icon: 'error' });
        }
        setIsSaving(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const result = await updateUserProfile(user.uid, {
            displayName: formData.displayName,
            bio: formData.bio,
            phone: formData.phone,
            avatar: formData.avatar,
            coverImage: formData.coverImage,
            location: {
                city: formData.city,
                state: formData.state,
            },
            bankDetails: {
                cbu: formData.cbu,
                alias: formData.alias,
                bankName: formData.bankName,
                holderName: formData.holderName,
                accountType: formData.accountType
            }
        });

        setIsSaving(false);

        if (result.success) {
            await refreshProfile();
            notify({
                type: 'success',
                title: 'Identidad Actualizada',
                message: 'Tus cambios de perfil han sido sincronizados de forma segura.',
                icon: 'check_circle'
            });
            navigate(`/profile/${user.uid}`);
        } else {
            notify({
                type: 'error',
                title: 'Fallo de Sincronización',
                message: 'No pudimos actualizar tu perfil en este momento.',
                icon: 'error'
            });
        }
    };

    const handlePurgeData = async () => {
        if (window.confirm("¿ESTÁS SEGURO? Esta acción purgará permanentemente tu identidad, historial de transacciones y certificados de la red de confianza. No se puede deshacer.")) {
            setLoading(true);
            const res = await deleteUserAccount(user.uid);
            if (res.success) {
                notify({ type: 'warning', title: 'Identidad Purgada', message: 'Tu cuenta ha sido eliminada de la infraestructura.', icon: 'delete_forever' });
                logout();
                navigate('/');
            } else {
                notify({ type: 'error', title: 'Fallo Crítico', message: res.message || 'No se pudo completar la purga de datos.', icon: 'report' });
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light-50 pb-40">
            {/* Header Area */}
            <div className="max-w-[1200px] mx-auto px-6 pt-12">
                <div className="flex items-center gap-6 mb-12">
                    <button
                        onClick={() => navigate(-1)}
                        className="size-14 bg-white rounded-2xl flex items-center justify-center border border-light-200 shadow-sm hover:bg-light-100 transition-all active:scale-95 group"
                    >
                        <span className="material-symbols-outlined font-black text-dark-800 group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    </button>
                    <h1 className="text-3xl font-black text-dark-800 uppercase tracking-tighter">Configuración de Protocolo de Seguridad</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                    {/* LEFT SIDEBAR: PROFILE SUMMARY & DANGER ZONE */}
                    <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                        {/* Profile Summary Card */}
                        <div className="bg-white p-10 rounded-[40px] shadow-premium border border-light-200 relative overflow-hidden group">
                            {/* Mini Cover Preview */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-light-100 cursor-pointer overflow-hidden group/cover" onClick={() => coverInputRef.current?.click()}>
                                <img src={previews.coverImage || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2670'} className="w-full h-full object-cover opacity-60 group-hover/cover:opacity-100 transition-all duration-500" alt="Cover Preview" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity bg-dark-800/40 backdrop-blur-[2px]">
                                    <span className="material-symbols-outlined text-white text-2xl font-black mb-1">landscape</span>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar Portada</span>
                                </div>
                            </div>

                            <div className="relative pt-16 flex flex-col items-center">
                                <div className="relative group/avatar cursor-pointer mb-6" onClick={() => avatarInputRef.current?.click()}>
                                    <div className="size-32 rounded-3xl border-[6px] border-white shadow-2xl overflow-hidden bg-white relative z-10 transition-transform group-hover/avatar:scale-105 duration-500">
                                        <img src={previews.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName)}&background=random`} className="w-full h-full object-cover" alt="Avatar Preview" />
                                    </div>
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity bg-dark-800/40 rounded-3xl backdrop-blur-sm">
                                        <span className="material-symbols-outlined text-white text-2xl mb-1">add_a_photo</span>
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Avatar</span>
                                    </div>
                                </div>
                                <h2 className="text-xl font-black text-dark-800 text-center mb-1">{formData.displayName}</h2>
                                <p className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full">{user.email}</p>
                            </div>

                            <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} />
                            <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'coverImage')} />
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-50/50 p-10 rounded-[40px] border border-red-100/50 space-y-6">
                            <div className="flex items-center gap-4 text-red-600">
                                <span className="material-symbols-outlined font-black">report</span>
                                <h3 className="text-sm font-black uppercase tracking-widest text-red-600">Zona de Advertencia</h3>
                            </div>
                            <p className="text-[10px] font-bold text-red-900/60 uppercase leading-relaxed">
                                Eliminación permanente de historial de transacciones, activos y certificados de verificación registrados en este nodo.
                            </p>
                            <button
                                onClick={handlePurgeData}
                                disabled={loading}
                                className="w-full bg-white border border-red-100 text-red-500 font-black py-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                            >
                                {loading ? 'PURGANDO...' : 'PURGAR DATOS'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT FORM: MAIN SETTINGS */}
                    <div className="lg:col-span-8 animate-in fade-in slide-in-from-right-4 duration-700">
                        <form onSubmit={handleSubmit} className="bg-white p-12 lg:p-16 rounded-[40px] shadow-premium border border-light-200/50 space-y-10">

                            {/* Merchant Name */}
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-4 ml-2">Nombre de Protocolo Mercante</label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full bg-light-50/50 border border-light-100 rounded-3xl py-6 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-base transition-all placeholder:opacity-30"
                                    placeholder="ej. Lucas Adrian Pulido"
                                    required
                                />
                            </div>

                            {/* Bio */}
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-4 ml-2">Bio de Inteligencia</label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-light-50/50 border border-light-100 rounded-3xl py-6 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-base transition-all h-40 resize-none placeholder:opacity-30"
                                    placeholder="Describe tu trayectoria o enfoque comercial..."
                                />
                            </div>

                            {/* Location & Secure Contact */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-4 ml-2">Nodo de Ciudad</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="w-full bg-light-50/50 border border-light-100 rounded-3xl py-6 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-base transition-all placeholder:opacity-30"
                                        placeholder="ej. Buenos Aires"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-4 ml-2">Contacto Seguro (Teléfono)</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-light-50/50 border border-light-100 rounded-3xl py-6 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-base transition-all placeholder:opacity-30"
                                        placeholder="+541168499501"
                                    />
                                </div>
                            </div>

                            {/* Bank Details Section */}
                            <div className="bg-light-50/30 p-8 rounded-[32px] border border-light-100">
                                <div className="flex items-center gap-3 mb-6 opacity-60">
                                    <span className="material-symbols-outlined text-primary-vibrant">account_balance</span>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-dark-800">Datos Bancarios de Cobro (Privado)</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-3 ml-2">CBU / CVU</label>
                                        <input
                                            type="text"
                                            value={formData.cbu}
                                            onChange={(e) => setFormData({ ...formData, cbu: e.target.value })}
                                            className="w-full bg-white border border-light-100 rounded-2xl py-4 px-6 focus:border-primary-vibrant outline-none font-mono text-sm transition-all placeholder:opacity-30"
                                            placeholder="22 dígitos"
                                            maxLength={22}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-3 ml-2">Alias</label>
                                        <input
                                            type="text"
                                            value={formData.alias}
                                            onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                                            className="w-full bg-white border border-light-100 rounded-2xl py-4 px-6 focus:border-primary-vibrant outline-none font-bold text-sm transition-all placeholder:opacity-30 uppercase"
                                            placeholder="MI.ALIAS.MP"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-3 ml-2">Banco / Entidad</label>
                                        <input
                                            type="text"
                                            value={formData.bankName}
                                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                            className="w-full bg-white border border-light-100 rounded-2xl py-4 px-6 focus:border-primary-vibrant outline-none font-bold text-sm transition-all placeholder:opacity-30"
                                            placeholder="ej. Mercado Pago / Santander"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-300 mb-3 ml-2">Titular de Cuenta</label>
                                        <input
                                            type="text"
                                            value={formData.holderName}
                                            onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                                            className="w-full bg-white border border-light-100 rounded-2xl py-4 px-6 focus:border-primary-vibrant outline-none font-bold text-sm transition-all placeholder:opacity-30"
                                            placeholder="Nombre Completo"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col items-center">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full max-w-sm bg-primary-vibrant text-white font-black py-6 rounded-3xl hover:shadow-2xl hover:shadow-primary-vibrant/20 transition-all text-xs uppercase tracking-[0.3em] shadow-xl shadow-primary-vibrant/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4"
                                >
                                    {isSaving && <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>}
                                    {isSaving ? 'ASEGURANDO...' : 'ASEGURAR CAMBIOS'}
                                </button>
                                <p className="mt-6 text-[9px] font-bold text-gray-300 uppercase tracking-widest text-center opacity-40">
                                    Los cambios se propagarán instantáneamente a través de todos los nodos de la red.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div >
        </div >
    );
}
