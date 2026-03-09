import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { updateUserProfile, deleteUserAccount } from '../lib/users';
import { uploadFile } from '../lib/storage';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'profile' | 'safety' | 'billing';

export default function Settings() {
    const navigate = useNavigate();
    const { user, userProfile, refreshProfile, logout } = useAuth();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('profile');

    // Form state
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        phone: '',
        city: '',
        state: '',
        avatar: '',
        coverImage: '',
        dni: '',
        social: {
            whatsapp: '',
            instagram: '',
            tiktok: '',
        },
        identity: {
            birthday: '',
            gender: '',
        },
        logistics: {
            deliveryMethods: [] as string[],
            businessHours: '',
        },
        bankDetails: {
            cbu: '',
            alias: '',
            bankName: '',
            holderName: '',
            accountType: 'Caja de Ahorro',
        }
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
                dni: userProfile.dni || '',
                social: {
                    whatsapp: userProfile.social?.whatsapp || '',
                    instagram: userProfile.social?.instagram || '',
                    tiktok: userProfile.social?.tiktok || '',
                },
                identity: {
                    birthday: userProfile.identity?.birthday || '',
                    gender: userProfile.identity?.gender || '',
                },
                logistics: {
                    deliveryMethods: userProfile.logistics?.deliveryMethods || [],
                    businessHours: userProfile.logistics?.businessHours || '',
                },
                bankDetails: {
                    cbu: userProfile.bankDetails?.cbu || '',
                    alias: userProfile.bankDetails?.alias || '',
                    bankName: userProfile.bankDetails?.bankName || '',
                    holderName: userProfile.bankDetails?.holderName || '',
                    accountType: userProfile.bankDetails?.accountType || 'Caja de Ahorro',
                }
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

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
        };
        reader.readAsDataURL(file);

        setIsSaving(true);
        try {
            const path = `profiles/${user.uid}/${type}_${Date.now()}`;
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
            social: formData.social,
            identity: formData.identity,
            logistics: formData.logistics,
            bankDetails: formData.bankDetails,
            dni: formData.dni,
        });

        setIsSaving(false);

        if (result.success) {
            await refreshProfile();
            notify({
                type: 'success',
                title: 'Perfil Actualizado',
                message: 'Tus cambios han sido guardados correctamente.',
                icon: 'check_circle'
            });
        } else {
            notify({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron guardar los cambios.',
                icon: 'error'
            });
        }
    };

    const handlePurgeData = async () => {
        if (window.confirm("¿ESTÁS SEGURO? Esta acción eliminará permanentemente tu cuenta y todos tus datos. No se puede deshacer.")) {
            setLoading(true);
            const res = await deleteUserAccount(user.uid);
            if (res.success) {
                notify({ type: 'warning', title: 'Cuenta Eliminada', message: 'Tu cuenta ha sido eliminada permanentemente.', icon: 'delete_forever' });
                logout();
                navigate('/');
            } else if (res.requiresReauth) {
                notify({
                    type: 'info',
                    title: 'Seguridad',
                    message: 'Por seguridad, debes volver a iniciar sesión para eliminar tu cuenta.',
                    icon: 'lock_reset'
                });
            } else {
                notify({ type: 'error', title: 'Error', message: 'No se pudo eliminar la cuenta.', icon: 'report' });
            }
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Perfil Público', icon: 'person' },
        { id: 'safety', label: 'Seguridad y Logística', icon: 'verified_user' },
        { id: 'billing', label: 'Datos de Cobro', icon: 'account_balance' },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">Configuración</h1>
                        <p className="text-slate-500 font-medium mt-1">Gestiona tu identidad, logística y pagos.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 p-1.5 bg-slate-200/50 rounded-2xl mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <span className="material-symbols-outlined text-xl">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <AnimatePresence mode="wait">
                        {/* TAB: PERFIL PUBLICO */}
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div className="flex flex-col sm:flex-row items-center gap-8">
                                    <div className="relative group">
                                        <div className="size-32 rounded-3xl overflow-hidden border-4 border-slate-50 shadow-inner bg-slate-100 relative">
                                            <img src={previews.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.displayName || user.email || 'U')}&background=random`} className="w-full h-full object-cover" />
                                            {isSaving && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="absolute -bottom-2 -right-2 size-10 bg-slate-900 text-white rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg">
                                            <span className="material-symbols-outlined text-xl">photo_camera</span>
                                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} accept="image/*" />
                                        </label>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="text-xl font-bold text-slate-900 font-display">Imagen de Perfil</h3>
                                        <p className="text-slate-400 text-sm font-medium mt-1">Sube una foto clara. Los perfiles con foto generan 3x más confianza.</p>
                                    </div>
                                </div>

                                {/* Cover Image Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Imagen de Portada</h3>
                                            <p className="text-slate-400 text-xs font-medium mt-0.5">Define la estética de tu tienda o perfil personal.</p>
                                        </div>
                                        <label className="bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 cursor-pointer transition-colors">
                                            Cambiar Portada
                                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'coverImage')} accept="image/*" />
                                        </label>
                                    </div>
                                    <div className="h-32 rounded-3xl overflow-hidden border-2 border-slate-50 bg-slate-100 group relative cursor-pointer hover:ring-2 hover:ring-primary-500/20 transition-all">
                                        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all z-10">
                                            <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                                <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Portada</span>
                                            </div>
                                            <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'coverImage')} accept="image/*" />
                                        </label>
                                        <img
                                            src={previews.coverImage || formData.coverImage || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2670"}
                                            className="w-full h-full object-cover"
                                        />
                                        {isSaving && (
                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-20">
                                                <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Público</label>
                                        <input
                                            type="text"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="Tu nombre o tienda"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Instagram (@usuario)</label>
                                        <input
                                            type="text"
                                            value={formData.social.instagram}
                                            onChange={(e) => setFormData({ ...formData, social: { ...formData.social, instagram: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="@usuario"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">TikTok (@usuario)</label>
                                        <input
                                            type="text"
                                            value={formData.social.tiktok || ''}
                                            onChange={(e) => setFormData({ ...formData, social: { ...formData.social, tiktok: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="@usuario"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Twitter / X (@usuario)</label>
                                        <input
                                            type="text"
                                            value={formData.social.twitter || ''}
                                            onChange={(e) => setFormData({ ...formData, social: { ...formData.social, twitter: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="@usuario"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Biografía / Acerca de ti</label>
                                    <textarea
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all resize-none"
                                        placeholder="Cuéntales a tus compradores quién eres o qué vendes..."
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: SEGURIDAD Y LOGISTICA */}
                        {activeTab === 'safety' && (
                            <motion.div
                                key="safety"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">DNI (Identidad Verificada)</label>
                                        <input
                                            type="text"
                                            value={formData.dni}
                                            onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="Número de documento"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contacto</label>
                                        <input
                                            type="text"
                                            value={formData.social.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, social: { ...formData.social, whatsapp: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="Ej: +54911..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            value={formData.identity.birthday}
                                            onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, birthday: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ciudad</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                            placeholder="Ej: Rosario"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Métodos de Entrega</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { id: 'pickup', label: 'Retiro en domicilio', icon: 'home' },
                                            { id: 'meeting', label: 'Punto de encuentro', icon: 'handshake' },
                                            { id: 'agreement', label: 'Acordar con vendedor', icon: 'chat' },
                                        ].map(method => (
                                            <label
                                                key={method.id}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.logistics.deliveryMethods.includes(method.id)
                                                    ? 'bg-slate-900 border-slate-900 text-white'
                                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={formData.logistics.deliveryMethods.includes(method.id)}
                                                    onChange={() => {
                                                        const methods = [...formData.logistics.deliveryMethods];
                                                        if (methods.includes(method.id)) {
                                                            setFormData({ ...formData, logistics: { ...formData.logistics, deliveryMethods: methods.filter(m => m !== method.id) } });
                                                        } else {
                                                            setFormData({ ...formData, logistics: { ...formData.logistics, deliveryMethods: [...methods, method.id] } });
                                                        }
                                                    }}
                                                />
                                                <span className="material-symbols-outlined text-xl">{method.icon}</span>
                                                <span className="text-sm font-bold">{method.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: DATOS DE COBRO */}
                        {activeTab === 'billing' && (
                            <motion.div
                                key="billing"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                                    <span className="material-symbols-outlined text-amber-600">info</span>
                                    <div>
                                        <p className="text-sm font-bold text-amber-800">Transferencias de Ventas</p>
                                        <p className="text-xs font-medium text-amber-700 mt-1">Asegúrate de que los datos coincidan con tu DNI para evitar demoras en los cobros reales.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-4 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CBU / CVU o Alias</label>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={formData.bankDetails.cbu || formData.bankDetails.alias}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (/^\d+$/.test(val)) {
                                                            setFormData({ ...formData, bankDetails: { ...formData.bankDetails, cbu: val, alias: '' } });
                                                        } else {
                                                            setFormData({ ...formData, bankDetails: { ...formData.bankDetails, alias: val, cbu: '' } });
                                                        }
                                                    }}
                                                    className="flex-1 bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all font-mono text-sm"
                                                    placeholder="22 dígitos o alias.ejemplo"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Banco / Entidad</label>
                                                <input
                                                    type="text"
                                                    value={formData.bankDetails.bankName || ''}
                                                    onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })}
                                                    className="w-full bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all text-sm"
                                                    placeholder="Ej: Banco Galicia, MercadoPago"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Titular de la Cuenta</label>
                                                <input
                                                    type="text"
                                                    value={formData.bankDetails.holderName || ''}
                                                    onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, holderName: e.target.value } })}
                                                    className="w-full bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all text-sm uppercase"
                                                    placeholder="NOMBRE COMPLETO"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">DNI del Titular (Para cotejar pagos)</label>
                                            <input
                                                type="text"
                                                value={formData.bankDetails.dni || ''}
                                                onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, dni: e.target.value } })}
                                                className="w-full bg-white border-2 border-slate-200 focus:border-slate-900 rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all font-mono text-sm"
                                                placeholder="Documento del titular de la cuenta"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 px-1">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo de Cuenta</label>
                                        <select
                                            value={formData.bankDetails.accountType}
                                            onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountType: e.target.value } })}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer"
                                        >
                                            <option>Caja de Ahorro</option>
                                            <option>Cuenta Corriente</option>
                                            <option>Cuenta Digital (Fintech)</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <div className="flex items-center gap-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-slate-900 text-white py-5 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-black transition-all active:scale-[0.98] shadow-xl shadow-slate-200 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    GUARDANDO...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-base">save</span>
                                    GUARDAR CAMBIOS
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Account Purge */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Zona de Peligro</h4>
                    <button
                        onClick={handlePurgeData}
                        className="text-red-500 text-sm font-bold flex items-center gap-2 hover:bg-red-50 p-3 rounded-xl transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">delete_forever</span>
                        Eliminar todos mis datos y cuenta
                    </button>
                </div>
            </div>
        </div>
    );
}
