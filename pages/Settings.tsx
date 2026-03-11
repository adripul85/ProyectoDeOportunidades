import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { updateUserProfile, deleteUserAccount, submitVerification } from '../lib/users';
import { uploadFile } from '../lib/storage';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';

type TabType = 'profile' | 'shop' | 'reputation' | 'safety' | 'billing';

export default function Settings() {
    const navigate = useNavigate();
    const { user, userProfile, profileLoading, refreshProfile, logout } = useAuth();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
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
            dni: '',
        },
        shopTheme: {
            backgroundType: 'gradient' as 'color' | 'image' | 'gradient',
            primaryColor: '#e11d48',
            secondaryColor: '#4f46e5',
            backgroundColor: '#0f172a',
            backgroundImage: '',
            accentColor: '#e11d48',
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
                    dni: userProfile.bankDetails?.dni || '',
                },
                shopTheme: userProfile.shopTheme || {
                    backgroundType: 'gradient',
                    primaryColor: '#e11d48',
                    secondaryColor: '#4f46e5',
                    backgroundColor: '#0f172a',
                    backgroundImage: '',
                    accentColor: '#e11d48',
                }
            });
            setPreviews({
                avatar: userProfile.avatar || '',
                coverImage: userProfile.coverImage || '',
            });
        }
    }, [userProfile]);

    if (profileLoading) {
        return <LoadingSpinner text="Sincronizando Protocolos..." />;
    }

    if (!user) {
        navigate('/login');
        return null;
    }

    // Fallback if profile failed to load but user is authenticated
    if (!userProfile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="size-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500">
                    <span className="material-symbols-outlined text-4xl">cloud_off</span>
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Error de Sincronización</h2>
                    <p className="text-slate-500 font-medium max-w-md mx-auto mt-2">No pudimos conectar con tu perfil. Por favor, intenta recargar la página.</p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all"
                >
                    Reintentar Conexión
                </button>
            </div>
        );
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'coverImage' | 'shopBackground') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        setUploadProgress('Optimizando...');

        try {
            // Compress image before upload
            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: type === 'shopBackground' ? 1920 : 1024,
                useWebWorker: true,
            };
            
            const compressedFile = await imageCompression(file, options);
            
            // Preview
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type !== 'shopBackground') {
                    setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
                }
            };
            reader.readAsDataURL(compressedFile);

            setUploadProgress('Subiendo...');
            const folder = type === 'shopBackground' ? 'shops' : 'profiles';
            const fileName = type === 'shopBackground' ? 'background' : type;
            const path = `${folder}/${user.uid}/${fileName}_${Date.now()}`;
            const url = await uploadFile(compressedFile, path);
            
            if (type === 'shopBackground') {
                setFormData(prev => ({ 
                    ...prev, 
                    shopTheme: { ...prev.shopTheme, backgroundImage: url } 
                }));
            } else {
                setFormData(prev => ({ ...prev, [type]: url }));
            }
            
            notify({ type: 'success', title: 'Imagen Optimizada', message: 'Se ha sincronizado y comprimido la nueva imagen.', icon: 'speed' });
        } catch (error: any) {
            console.error("Error in handleFileChange:", error);
            notify({ 
                type: 'error', 
                title: 'Error de Carga', 
                message: error.message?.includes('403') ? 'Error de permisos en el servidor. Reintentando...' : 'No se pudo procesar la imagen.', 
                icon: 'error' 
            });
        } finally {
            setIsSaving(false);
            setUploadProgress('');
        }
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
            shopTheme: formData.shopTheme,
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
        { id: 'shop', label: 'Mi Tienda', icon: 'palette' },
        { id: 'reputation', label: 'Mi Reputación', icon: 'military_tech' },
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
                                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                                    <div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-1" />
                                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">{uploadProgress}</span>
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
                                    </div>
                                    <div className="relative aspect-[21/9] sm:aspect-[21/6] rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 group">
                                        <img src={previews.coverImage || formData.coverImage || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1000'} className="w-full h-full object-cover" />
                                        {isSaving && (
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-all z-20">
                                                <div className="size-8 border-3 border-white/20 border-t-white rounded-full animate-spin mb-2" />
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{uploadProgress}</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <label className="cursor-pointer">
                                                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                                                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Cambiar Portada</span>
                                                </div>
                                                <input type="file" className="hidden" onChange={(e) => handleFileChange(e, 'coverImage')} accept="image/*" />
                                            </label>
                                        </div>
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

                        {/* TAB: MI TIENDA (PERSONALIZACION) */}
                        {activeTab === 'shop' && (
                            <motion.div
                                key="shop"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="size-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                        <span className="material-symbols-outlined text-2xl font-black">palette</span>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Personalización de Tienda</h4>
                                        <p className="text-slate-500 text-sm font-medium">Define los colores y el fondo que verán tus clientes.</p>
                                    </div>
                                </div>

                                {/* Background Type Selector */}
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Fondo</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'color', label: 'Color Sólido', icon: 'format_color_fill' },
                                            { id: 'gradient', label: 'Gradiente Moderno', icon: 'gradient' },
                                            { id: 'image', label: 'Imagen de Marca', icon: 'image' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setFormData({ 
                                                    ...formData, 
                                                    shopTheme: { ...formData.shopTheme, backgroundType: type.id as any } 
                                                })}
                                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${formData.shopTheme.backgroundType === type.id
                                                    ? 'bg-slate-900 border-slate-900 text-white'
                                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-xl">{type.icon}</span>
                                                <span className="text-sm font-bold">{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Conditional Settings based on Background Type */}
                                <AnimatePresence mode="wait">
                                    {formData.shopTheme.backgroundType === 'color' && (
                                        <motion.div 
                                            key="color-settings"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4 pt-4 border-t border-slate-100"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color de Fondo</label>
                                                <div className="flex gap-4 items-center">
                                                    <input 
                                                        type="color" 
                                                        value={formData.shopTheme.backgroundColor}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, backgroundColor: e.target.value }
                                                        })}
                                                        className="size-12 rounded-xl cursor-pointer border-none bg-transparent"
                                                    />
                                                    <input 
                                                        type="text"
                                                        value={formData.shopTheme.backgroundColor}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, backgroundColor: e.target.value }
                                                        })}
                                                        className="flex-1 bg-slate-50 border-2 border-transparent rounded-xl py-3 px-4 font-mono font-bold text-slate-600 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {formData.shopTheme.backgroundType === 'gradient' && (
                                        <motion.div 
                                            key="gradient-settings"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color Primario</label>
                                                <div className="flex gap-3 items-center">
                                                    <input 
                                                        type="color" 
                                                        value={formData.shopTheme.primaryColor.startsWith('rgb') ? '#4f46e5' : formData.shopTheme.primaryColor}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, primaryColor: e.target.value }
                                                        })}
                                                        className="size-12 rounded-xl cursor-pointer border-none bg-transparent"
                                                    />
                                                    <div className="flex-1 relative">
                                                        <input 
                                                            type="text"
                                                            value={formData.shopTheme.primaryColor}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                shopTheme: { ...formData.shopTheme, primaryColor: e.target.value }
                                                            })}
                                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-xl py-3 px-4 font-mono font-bold text-slate-600 outline-none"
                                                            placeholder="#000000 o rgb(0,0,0)"
                                                        />
                                                        <div 
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 size-4 rounded-full border border-slate-200"
                                                            style={{ backgroundColor: formData.shopTheme.primaryColor }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color Secundario</label>
                                                <div className="flex gap-3 items-center">
                                                    <input 
                                                        type="color" 
                                                        value={formData.shopTheme.secondaryColor.startsWith('rgb') ? '#9333ea' : formData.shopTheme.secondaryColor}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, secondaryColor: e.target.value }
                                                        })}
                                                        className="size-12 rounded-xl cursor-pointer border-none bg-transparent"
                                                    />
                                                    <div className="flex-1 relative">
                                                        <input 
                                                            type="text"
                                                            value={formData.shopTheme.secondaryColor}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                shopTheme: { ...formData.shopTheme, secondaryColor: e.target.value }
                                                            })}
                                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-purple-100 rounded-xl py-3 px-4 font-mono font-bold text-slate-600 outline-none"
                                                            placeholder="#000000 o rgb(0,0,0)"
                                                        />
                                                        <div 
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 size-4 rounded-full border border-slate-200"
                                                            style={{ backgroundColor: formData.shopTheme.secondaryColor }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {formData.shopTheme.backgroundType === 'image' && (
                                        <motion.div 
                                            key="image-settings"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6 pt-4 border-t border-slate-100"
                                        >
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Imagen de Fondo</label>
                                                    <label className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-lg flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-sm">upload</span>
                                                        Subir desde mi equipo
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            onChange={(e) => handleFileChange(e, 'shopBackground')} 
                                                            accept="image/*" 
                                                        />
                                                    </label>
                                                </div>

                                                <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 group">
                                                    {formData.shopTheme.backgroundImage ? (
                                                        <img 
                                                            src={formData.shopTheme.backgroundImage} 
                                                            className="w-full h-full object-cover" 
                                                            alt="Fondo de Tienda"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                                            <span className="material-symbols-outlined text-4xl mb-2">image</span>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin Imagen</p>
                                                        </div>
                                                    )}
                                                    
                                                    {isSaving && (
                                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 transition-all duration-300">
                                                            <div className="size-10 border-4 border-white/20 border-t-white rounded-full animate-spin shadow-lg mb-3" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{uploadProgress}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">O pegar URL externa</label>
                                                    <input 
                                                        type="text"
                                                        value={formData.shopTheme.backgroundImage || ''}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            shopTheme: { ...formData.shopTheme, backgroundImage: e.target.value }
                                                        })}
                                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-xl py-3 px-4 outline-none font-bold text-slate-700 transition-all text-sm"
                                                        placeholder="https://ejemplo.com/mi-fondo.jpg"
                                                    />
                                                </div>
                                                
                                                <p className="text-[10px] font-medium text-slate-400 px-1 italic">
                                                    Recomendado: Imágenes horizontales de alta resolución (1920x1080).
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Accent Color */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Color de Acento (Botones y Detalles)</label>
                                        <div className="flex gap-4 items-center">
                                            <input 
                                                type="color" 
                                                value={formData.shopTheme.accentColor}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    shopTheme: { ...formData.shopTheme, accentColor: e.target.value }
                                                })}
                                                className="size-12 rounded-xl cursor-pointer border-none bg-transparent"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {['#e11d48', '#4f46e5', '#16a34a', '#d97706', '#9333ea', '#0891b2'].map(c => (
                                                    <button 
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, shopTheme: { ...formData.shopTheme, accentColor: c } })}
                                                        className={`size-8 rounded-lg border-2 transition-all ${formData.shopTheme.accentColor === c ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: REPUTACION */}
                        {activeTab === 'reputation' && (
                            <motion.div
                                key="reputation"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                    <div className={`p-6 rounded-[24px] ${userProfile.trustLevel === 'Bajo' ? 'bg-red-50 text-red-500' : userProfile.trustLevel === 'Medio' ? 'bg-amber-50 text-amber-500' : 'bg-primary-50 text-primary-vibrant'} shrink-0 relative z-10`}>
                                        <span className="material-symbols-outlined text-6xl font-black">
                                            {userProfile.trustLevel === 'Bajo' ? 'verified_user' : userProfile.trustLevel === 'Medio' ? 'workspace_premium' : 'military_tech'}
                                        </span>
                                    </div>
                                    <div className="flex-1 relative z-10 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg ${userProfile.trustLevel === 'Bajo' ? 'bg-red-100 text-red-600' : userProfile.trustLevel === 'Medio' ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                                                {userProfile.sellerStatus || 'Socio en Prueba'}
                                            </span>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Nivel de Confianza: {userProfile.trustLevel || 'Bajo'}</h3>
                                        <p className="text-slate-500 font-medium mt-2">Tu nivel determina tu visibilidad y los beneficios en la red de Vendelo Ya!</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <span className="material-symbols-outlined text-[120px] font-black">shield_with_heart</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Próximo Nivel: {userProfile.trustLevel === 'Bajo' ? 'Medio' : userProfile.trustLevel === 'Medio' ? 'Alto' : 'Elite'}</h4>
                                        <div className="space-y-6">
                                            {/* Requirement 1: DNI */}
                                            <div className="flex items-start gap-4">
                                                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 border-2 ${userProfile.dni ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-300'}`}>
                                                    <span className="material-symbols-outlined text-sm font-black">{userProfile.dni ? 'check' : 'lock'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${userProfile.dni ? 'text-slate-900' : 'text-slate-400'}`}>Vincular DNI</p>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">Identidad básica para generar confianza.</p>
                                                    {!userProfile.dni && (
                                                        <button type="button" onClick={() => setActiveTab('safety')} className="text-[10px] font-black text-primary-vibrant mt-2 uppercase tracking-widest hover:underline">Vincular Ahora →</button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Requirement 2: CBU */}
                                            <div className="flex items-start gap-4">
                                                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 border-2 ${userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-300'}`}>
                                                    <span className="material-symbols-outlined text-sm font-black">{userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias ? 'check' : 'lock'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias ? 'text-slate-900' : 'text-slate-400'}`}>Vincular CBU/CVU de Cobro</p>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">Valida tu existencia en el sistema bancario.</p>
                                                    {!(userProfile.bankDetails?.cbu || userProfile.bankDetails?.alias) && (
                                                        <button type="button" onClick={() => setActiveTab('billing')} className="text-[10px] font-black text-primary-vibrant mt-2 uppercase tracking-widest hover:underline">Vincular Ahora →</button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Requirement 3: Sales */}
                                            <div className="flex items-start gap-4">
                                                <div className={`size-6 rounded-full flex items-center justify-center shrink-0 border-2 ${(userProfile.successfulSales || 0) >= (userProfile.trustLevel === 'Bajo' ? 1 : 10) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-300'}`}>
                                                    <span className="material-symbols-outlined text-sm font-black">{(userProfile.successfulSales || 0) >= (userProfile.trustLevel === 'Bajo' ? 1 : 10) ? 'check' : 'bolt'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${(userProfile.successfulSales || 0) >= (userProfile.trustLevel === 'Bajo' ? 1 : 10) ? 'text-slate-900' : 'text-slate-400'}`}>Realizar {(userProfile.trustLevel === 'Bajo' ? 1 : 10)} Venta Exitosa</p>
                                                    <p className="text-xs font-medium text-slate-400 mt-0.5">Actual: {userProfile.successfulSales || 0} ventas completadas.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-[32px] p-10 shadow-xl shadow-slate-200 text-white relative overflow-hidden">
                                        <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] mb-8">Beneficios del Nivel</h4>
                                        <ul className="space-y-6">
                                            {[
                                                { label: 'Badge de Verificado en productos', icon: 'shield' },
                                                { label: 'Menor retención de pagos', icon: 'payments' },
                                                { label: 'Soporte prioritario', icon: 'support_agent' },
                                                { label: 'Mayor límite de publicaciones', icon: 'list_alt' }
                                            ].map((b, i) => (
                                                <li key={i} className="flex items-center gap-4 group">
                                                    <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <span className="material-symbols-outlined text-xl">{b.icon}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{b.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="absolute -right-10 -bottom-10 opacity-10">
                                            <span className="material-symbols-outlined text-[160px] font-black rotate-12">auto_awesome</span>
                                        </div>
                                    </div>
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
                                className="space-y-8"
                            >
                                {/* KYC Verification Section */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="size-12 bg-primary-vibrant rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                            <span className="material-symbols-outlined text-2xl font-black">verified</span>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight">Verificación de Identidad (KYC)</h4>
                                            <p className="text-slate-500 text-sm font-medium">Validación oficial para desbloquear beneficios de vendedor.</p>
                                        </div>
                                    </div>

                                    {/* Status Banner */}
                                    {userProfile.verificationEvidence?.status && userProfile.verificationEvidence.status !== 'none' && (
                                        <div className={`mb-8 p-6 rounded-2xl border flex gap-4 items-center ${userProfile.verificationEvidence.status === 'approved' ? 'bg-emerald-50 border-emerald-100' :
                                            userProfile.verificationEvidence.status === 'rejected' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                                            }`}>
                                            <span className={`material-symbols-outlined text-2xl ${userProfile.verificationEvidence.status === 'approved' ? 'text-emerald-600' :
                                                userProfile.verificationEvidence.status === 'rejected' ? 'text-rose-600' : 'text-amber-600'
                                                }`}>
                                                {userProfile.verificationEvidence.status === 'approved' ? 'verified_user' :
                                                    userProfile.verificationEvidence.status === 'rejected' ? 'report_problem' : 'work_history'
                                                }
                                            </span>
                                            <div className="flex-1">
                                                <p className={`text-sm font-black uppercase tracking-widest ${userProfile.verificationEvidence.status === 'approved' ? 'text-emerald-700' :
                                                    userProfile.verificationEvidence.status === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                                                    }`}>
                                                    {userProfile.verificationEvidence.status === 'approved' ? 'Identidad Verificada' :
                                                        userProfile.verificationEvidence.status === 'rejected' ? 'Verificación Rechazada' : 'Verificación en Proceso'
                                                    }
                                                </p>
                                                {userProfile.verificationEvidence.status === 'rejected' && userProfile.verificationEvidence.rejectionReason && (
                                                    <p className="text-xs font-bold text-rose-600/70 mt-1 italic">Motivo: "{userProfile.verificationEvidence.rejectionReason}"</p>
                                                )}
                                                {userProfile.verificationEvidence.status === 'pending' && (
                                                    <p className="text-xs font-bold text-amber-600/70 mt-0.5">Nuestro equipo está auditando tus documentos. Esto suele demorar menos de 24hs.</p>
                                                )}
                                            </div>
                                            {userProfile.verificationEvidence.status === 'rejected' && (
                                                <button
                                                    type="button"
                                                    onClick={() => updateUserProfile(user.uid, { "verificationEvidence.status": "none" }).then(() => refreshProfile())}
                                                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all"
                                                >
                                                    Reintentar
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Upload Interface */}
                                    {(userProfile.verificationEvidence?.status === 'none' || !userProfile.verificationEvidence?.status) && (
                                        <div className="space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    { key: 'dniFront', label: 'Frente DNI', icon: 'badge' },
                                                    { key: 'dniBack', label: 'Dorso DNI', icon: 'credit_card' },
                                                    { key: 'selfie', label: 'Selfie', icon: 'face' }
                                                ].map((step) => (
                                                    <div key={step.key} className="space-y-3">
                                                        <div className="relative group aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary-vibrant/50 hover:bg-slate-100">
                                                            {userProfile.verificationEvidence?.[step.key as keyof typeof userProfile.verificationEvidence] ? (
                                                                <img
                                                                    src={userProfile.verificationEvidence[step.key as keyof typeof userProfile.verificationEvidence] as string}
                                                                    className="w-full h-full object-cover"
                                                                    alt={step.label}
                                                                />
                                                            ) : (
                                                                <div className="text-center p-4">
                                                                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">{step.icon}</span>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{step.label}</span>
                                                                </div>
                                                            )}
                                                            <label className="absolute inset-0 cursor-pointer bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (!file) return;
                                                                        setIsSaving(true);
                                                                        try {
                                                                            const path = `kyc/${user.uid}/${step.key}_${Date.now()}`;
                                                                            const url = await uploadFile(file, path);
                                                                            await updateUserProfile(user.uid, {
                                                                                [`verificationEvidence.${step.key}`]: url
                                                                            });
                                                                            await refreshProfile();
                                                                            notify({ type: 'success', title: 'Imagen Cargada', message: step.label + ' sincronizado.', icon: 'check_circle' });
                                                                        } catch (err) {
                                                                            notify({ type: 'error', title: 'Error', message: 'Fallo al subir archivo.', icon: 'error' });
                                                                        }
                                                                        setIsSaving(false);
                                                                    }}
                                                                />
                                                                {!userProfile.verificationEvidence?.[step.key as keyof typeof userProfile.verificationEvidence] && (
                                                                    <span className="absolute bottom-4 right-4 size-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                                        <span className="material-symbols-outlined text-sm">add_a_photo</span>
                                                                    </span>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Submit for Review Button */}
                                            {userProfile.verificationEvidence?.dniFront && userProfile.verificationEvidence?.dniBack && userProfile.verificationEvidence?.selfie && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        setIsSaving(true);
                                                        await submitVerification(user.uid);
                                                        await refreshProfile();
                                                        setIsSaving(false);
                                                        notify({ type: 'success', title: 'Enviado', message: 'Tus documentos están siendo revisados.', icon: 'send' });
                                                    }}
                                                    className="w-full py-4 bg-primary-vibrant text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20 hover:scale-[1.02] transition-all"
                                                >
                                                    Enviar para Revisión
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número de DNI</label>
                                            <input
                                                type="text"
                                                value={formData.dni}
                                                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                                                className="w-full bg-slate-50 border-2 border-transparent focus:border-slate-100 focus:bg-white rounded-2xl py-4 px-6 outline-none font-bold text-slate-700 transition-all"
                                                placeholder="Solo números"
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
                                </div>
                            </motion.div>
                        )}

                        {/* TAB: DATOS DE COBRO & MERCADO PAGO */}
                        {activeTab === 'billing' && (
                            <motion.div
                                key="billing"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* MERCADO PAGO OAUTH SECTION */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#009ee3]/5 rounded-full blur-[60px] pointer-events-none -mt-20 -mr-20"></div>

                                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-6 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="size-16 rounded-[20px] bg-[#009ee3] flex items-center justify-center p-3 shadow-lg shadow-[#009ee3]/20">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mercado_Libre_logo.svg/1200px-Mercado_Libre_logo.svg.png" className="w-full h-full object-contain brightness-0 invert" alt="Mercado Pago" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Cobros Automáticos</h4>
                                                <p className="text-slate-500 text-sm font-medium mt-0.5">Recibe el dinero de tus ventas directo en tu cuenta.</p>
                                            </div>
                                        </div>

                                        {userProfile.mercadoPagoOAuth ? (
                                            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-4 py-3 rounded-2xl border border-emerald-100/50">
                                                <span className="material-symbols-outlined font-black">check_circle</span>
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest">Cuenta Vinculada</p>
                                                    <p className="text-[10px] font-bold opacity-80 uppercase">ID: {userProfile.mercadoPagoOAuth.userId}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // In production, use your actual environment variables
                                                    const clientId = import.meta.env.VITE_MP_CLIENT_ID || 'PENDING_CLIENT_ID';
                                                    const redirectUri = `${window.location.origin}/api/mercadopago-oauth`;
                                                    const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&redirect_uri=${redirectUri}&state=${user.uid}`;
                                                    window.location.href = authUrl;
                                                }}
                                                className="bg-[#009ee3] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#009ee3]/20 hover:bg-[#008cc7] transition-all active:scale-[0.98] flex items-center gap-2 whitespace-nowrap w-full md:w-auto justify-center"
                                            >
                                                <span className="material-symbols-outlined text-base">link</span>
                                                Vincular Cuenta
                                            </button>
                                        )}
                                    </div>

                                    {!userProfile.mercadoPagoOAuth && (
                                        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3 relative z-10">
                                            <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5">security</span>
                                            <p className="text-xs font-bold text-amber-800 leading-relaxed">
                                                Para vender en la plataforma usando "Pago Protegido", es obligatorio vincular tu cuenta de Mercado Pago. Nosotros dividimos el pago automáticamente, dejándote el 100% de tu ganancia al confirmar la entrega, sin intermediarios.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* TRANSFERENCIAS BANCARIAS MANUALES (LEGACY/RECAUDADORA) */}
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-8 opacity-60 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center justify-between pb-4 border-b border-light-100">
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">CBU de Respaldo (Opcional)</h4>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                                        <span className="material-symbols-outlined text-slate-400">info</span>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">Liquidaciones Manuales</p>
                                            <p className="text-xs font-medium text-slate-500 mt-1">Si Mercado Pago no está disponible, usaremos estos datos bancarios para transferirte tus ganancias. Asegúrate de que coincida con tu DNI.</p>
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
