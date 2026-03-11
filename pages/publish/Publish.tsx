import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publishItem, ItemData, getProduct, updateItem } from '../../lib/items';
import { CATEGORIES } from '../../lib/constants';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../lib/auth';
import { uploadFile } from '../../lib/storage';
import { getPlatformSettings, PlatformSettings } from '../../lib/settings';
import { Timestamp } from 'firebase/firestore';
import imageCompression from 'browser-image-compression';

export default function Publish() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const { user, userProfile } = useAuth();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');

    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    const [form, setForm] = useState({
        title: '',
        price: '',
        description: '',
        category: CATEGORIES[0].name,
        subcategory: '',
        condition: 'like_new' as const,
        brand: '',
        color: '',
        shippingAvailable: true,
        deliveryMethods: ['en_mano'] as string[],
        isFeatured: false,
        quantity: 1
    });

    const [settings, setSettings] = useState<PlatformSettings | null>(null);

    // Cargar configuración global al montar
    React.useEffect(() => {
        getPlatformSettings().then(setSettings);
    }, []);

    // Load existing data if editing
    React.useEffect(() => {
        if (editId) {
            setLoading(true);
            getProduct(editId).then(item => {
                if (item) {
                    setForm({
                        title: item.title,
                        price: item.price.toLocaleString('es-AR'),
                        description: item.description,
                        category: item.category,
                        subcategory: item.subcategory || '',
                        condition: item.condition,
                        brand: item.brand || '',
                        color: item.color || '',
                        shippingAvailable: item.shippingAvailable !== undefined ? item.shippingAvailable : true,
                        deliveryMethods: item.deliveryMethods || ['en_mano'],
                        isFeatured: item.isFeatured || false,
                        quantity: item.quantity || 1
                    });
                    setExistingImages(item.images || []);
                    setPreviews(item.images || []);
                }
                setLoading(false);
            });
        }
    }, [editId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        if (name === 'category') {
            setForm({ ...form, category: val as string, subcategory: '' });
        } else {
            setForm({ ...form, [name]: val });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            const options = {
                maxSizeMB: 1,
                maxWidthOrHeight: 1280,
                useWebWorker: true,
            };

            setLoading(true);
            setUploadProgress('Comprimiendo fotos...');

            try {
                const compressedFiles = await Promise.all(
                    files.map(async (file: File) => {
                        // Skip if already small
                        if (file.size / 1024 / 1024 < 1) return file;
                        return await imageCompression(file, options);
                    })
                );

                setSelectedFiles(prev => [...prev, ...compressedFiles as File[]]);
                const newPreviews = compressedFiles.map(file => URL.createObjectURL(file as Blob));
                setPreviews(prev => [...prev, ...newPreviews]);

                notify({ type: 'success', title: 'Fotos optimizadas', message: 'Tus imágenes se comprimieron para una carga ultra rápida.', icon: 'speed' });
            } catch (error) {
                console.error("Error compressing images:", error);
                notify({ type: 'error', title: 'Error', message: 'No pudimos procesar las fotos.', icon: 'error' });
            } finally {
                setLoading(false);
                setUploadProgress('');
            }
        }
    };

    const removeFile = (index: number) => {
        if (index < existingImages.length) {
            // Remove from existing images
            setExistingImages(prev => prev.filter((_, i) => i !== index));
        } else {
            // Remove from newly selected files
            const selectedFilesIndex = index - existingImages.length;
            setSelectedFiles(prev => prev.filter((_, i) => i !== selectedFilesIndex));
        }

        setPreviews(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // Only revoke object URL if it's a newly selected file
            if (index >= existingImages.length) {
                URL.revokeObjectURL(prev[index]);
            }
            return updated;
        });
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            if (!form.title || !form.price) {
                notify({ type: 'warning', title: 'Datos Faltantes', message: 'Por favor, proporciona un título y precio para tu ítem.', icon: 'edit' });
                return;
            }

            // Parse Price: Remove dots (thousands separation) and replace comma with dot (decimal)
            const cleanPrice = form.price.replace(/\./g, '').replace(',', '.');
            const parsedPrice = parseFloat(cleanPrice);

            if (isNaN(parsedPrice) || parsedPrice <= 0) {
                notify({ type: 'warning', title: 'Precio Inválido', message: 'Por favor ingresa un precio válido.', icon: 'payments' });
                return;
            }

            if (!user) {
                notify({ type: 'error', title: 'Acceso Denegado', message: 'Debes iniciar sesión para publicar ítems.', icon: 'lock' });
                return;
            }

            const uploadedImages: string[] = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                try {
                    setUploadProgress(`Subiendo (${i + 1}/${selectedFiles.length})...`);
                    const url = await uploadFile(file, `items/${user.uid}/${Date.now()}_${file.name}`);
                    uploadedImages.push(url);
                } catch (err) {
                    console.error("Error uploading image:", err);
                    notify({ type: 'warning', title: 'Error de Imagen', message: `No se pudo subir la imagen ${i + 1}.`, icon: 'warning' });
                }
            }

            setUploadProgress('Finalizando...');

            let result;
            const finalImages = [...existingImages, ...uploadedImages];

            // Format location string
            const sellerLocation = userProfile?.location
                ? `${userProfile.location.city}, ${userProfile.location.state}`
                : undefined;

            if (editId) {
                // Update existing item
                const updateResult = await updateItem(editId, {
                    title: form.title,
                    price: parsedPrice,
                    description: form.description,
                    category: form.category,
                    subcategory: form.subcategory,
                    condition: form.condition as any,
                    brand: form.brand,
                    color: form.color,
                    shippingAvailable: form.deliveryMethods.some(m => ['correo_argentino', 'domicilio'].includes(m)),
                    deliveryMethods: form.deliveryMethods,
                    images: finalImages.length > 0 ? finalImages : ["https://picsum.photos/400/400?random=1"],
                    location: sellerLocation
                });
                result = { success: updateResult.success, id: editId };
            } else {
                // Publish new item
                let featuredUntil: Timestamp | null = null;
                if (form.isFeatured && settings) {
                    const expirationDate = new Date();
                    expirationDate.setHours(expirationDate.getHours() + settings.featuredDurationHours);
                    featuredUntil = Timestamp.fromDate(expirationDate);
                }

                result = await publishItem({
                    title: form.title,
                    price: parsedPrice,
                    description: form.description,
                    category: form.category,
                    condition: form.condition as any,
                    brand: form.brand,
                    color: form.color,
                    shippingAvailable: form.deliveryMethods.some(m => ['correo_argentino', 'domicilio'].includes(m)),
                    deliveryMethods: form.deliveryMethods,
                    images: finalImages.length > 0 ? finalImages : ["https://picsum.photos/400/400?random=1"],
                    sellerId: user.uid,
                    sellerName: userProfile?.name || user.displayName || 'Vendedor',
                    location: sellerLocation,
                    views: 0,
                    isFeatured: form.isFeatured,
                    quantity: form.quantity || 1,
                    featuredUntil: featuredUntil,
                    featuredFeeApplied: form.isFeatured ? (settings?.featuredExtraPercentage || 0.05) : 0
                });
            }

            if (result.success) {
                notify({ type: 'success', title: editId ? 'Actualizado' : '¡Publicado!', message: editId ? 'Tu publicación ha sido actualizada.' : 'Tu ítem ya está en el marketplace.', icon: 'rocket_launch' });
                navigate(editId ? '/dashboard' : `/product/${result.id}`);
            } else {
                notify({ type: 'error', title: 'Error de Firebase', message: 'Fallo al guardar en la base de datos.', icon: 'cloud_off' });
            }
        } catch (error: any) {
            console.error("Critical error in handleSubmit:", error);
            notify({ type: 'error', title: 'Error Crítico', message: error.message || 'Ocurrió un fallo inesperado al publicar.', icon: 'bug_report' });
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    // Lógica del Wizard
    const [step, setStep] = useState(1);
    const nextStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(prev => prev + 1);
    };
    const prevStep = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setStep(prev => prev - 1);
    };

    const hasMercadoPago = !!userProfile?.mercadoPagoOAuth;

    // BLOQUEO: Obligatorio Mercado Pago OAuth (Split Payments)
    if (userProfile && !hasMercadoPago) {
        return (
            <div className="bg-light-50 min-h-screen flex items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="bg-white rounded-[40px] shadow-premium border border-light-200 p-8 lg:p-12 max-w-lg text-center overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#009ee3]/5 rounded-full blur-[60px] pointer-events-none -mt-20 -mr-20"></div>

                    <div className="size-24 bg-[#009ee3] text-white rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#009ee3]/20 relative z-10 p-4">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Mercado_Libre_logo.svg/1200px-Mercado_Libre_logo.svg.png" className="w-full h-full object-contain brightness-0 invert" alt="Mercado Pago" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-dark-800 tracking-tighter mb-4 uppercase relative z-10">Vinculá tu Cuenta</h2>
                    
                    <p className="text-sm font-bold text-gray-500 mb-8 leading-relaxed relative z-10">
                        Para poder vender y operar con <strong>Pago Protegido</strong> de forma automática y que el dinero te ingrese directamente a vos, es obligatorio vincular tu cuenta de <strong>Mercado Pago</strong> como vendedor.
                    </p>
                    
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-full bg-[#009ee3] text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-[#009ee3]/20 hover:bg-[#008cc7] transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10"
                    >
                        <span className="material-symbols-outlined text-sm">link</span>
                        Vincular Cuenta Ahora
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full mt-6 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-dark-800 transition-colors"
                    >
                        Volver Atrás
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light-50 min-h-screen">
            <div className="max-w-3xl mx-auto px-6 py-6 lg:py-12 font-sans">

                {/* Header Context / Edit Alert */}
                <div className="mb-8 space-y-2 text-center">
                    <h1 className="text-3xl lg:text-4xl font-black text-dark-800 tracking-tighter uppercase">{editId ? 'Editar Publicación' : 'Vender un Producto'}</h1>
                    <p className="text-[11px] font-bold text-gray-400 border border-light-200 bg-white inline-block px-4 py-1.5 rounded-full uppercase tracking-widest leading-relaxed">
                        {editId ? 'Actualizando tu oferta actual' : 'Llega a miles de compradores'}
                    </p>
                </div>

                {/* Barra de Progreso Sutil */}
                <div className="flex gap-2 mb-10 lg:mb-16">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 flex-grow rounded-full transition-all duration-700 ${step >= i ? 'bg-primary-vibrant shadow-[0_0_15px_rgba(34,34,255,0.4)]' : 'bg-light-200'}`} />
                    ))}
                </div>

                <div className="bg-white rounded-[40px] shadow-premium border border-light-200/50 p-6 lg:p-12 min-h-[500px] flex flex-col justify-between relative overflow-hidden">

                    {/* PASO 1: FOTOS */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-700 h-full flex flex-col">
                            <div>
                                <h2 className="text-3xl lg:text-4xl font-black text-dark-800 uppercase tracking-tighter mb-2">Mostralo al Mundo</h2>
                                <p className="text-gray-400 mb-8 font-bold text-sm tracking-tight">Las buenas fotos venden solas. Sube hasta 10 imágenes claras de lo que ofreces.</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                                {/* Zona de carga si no hay suficientes */}
                                {previews.length < 10 && (
                                    <label className="w-full bg-light-50 border-2 border-dashed border-light-200 hover:border-primary-200 hover:bg-primary-50/20 rounded-[32px] p-10 text-center space-y-4 transition-all group relative cursor-pointer flex flex-col items-center">
                                        <div className="size-16 bg-white rounded-2xl mx-auto flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-light-100">
                                            <span className="material-symbols-outlined text-3xl text-primary-vibrant font-black group-hover:rotate-12 transition-transform">add_a_photo</span>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-dark-800 text-sm">Agregar Fotos</h4>
                                            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-1">Haz clic para buscar en tu galería</p>
                                        </div>
                                        <input type="file" multiple disabled={loading} accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}

                                {/* Galería de Fotos Subidas */}
                                {previews.length > 0 && (
                                    <div className="w-full">
                                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Tus Imágenes ({previews.length}/10)</h4>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {previews.map((src, i) => (
                                                <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm relative group bg-light-50 border border-light-100 animate-in zoom-in-95 duration-300">
                                                    <img src={src} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={`Preview ${i}`} />
                                                    {/* Botón Eliminar */}
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); removeFile(i); }}
                                                        className="absolute top-2 right-2 size-6 lg:size-8 bg-red-500 hover:bg-red-600 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                                                    >
                                                        <span className="material-symbols-outlined text-[14px] lg:text-base font-black">close</span>
                                                    </button>
                                                    {i === 0 && (
                                                        <div className="absolute bottom-2 left-2 bg-dark-900/80 backdrop-blur-sm text-white text-[8px] font-black uppercase px-2 py-1 rounded-md">Portada</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PASO 2: DETALLES */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8 flex-1">
                            <div>
                                <h2 className="text-3xl lg:text-4xl font-black text-dark-800 uppercase tracking-tighter mb-2">Detalles Claros</h2>
                                <p className="text-gray-400 mb-8 font-bold text-sm tracking-tight">Cuanto más específico seas, menos preguntas te harán.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Título */}
                                <div>
                                    <label className="block text-[10px] items-center  font-black uppercase tracking-widest text-primary-vibrant mb-3 ml-2">¿Qué estás vendiendo?</label>
                                    <input
                                        name="title"
                                        type="text"
                                        placeholder="Ej: iPhone 13 Pro 128GB Inmaculado"
                                        className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 text-lg font-black text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all placeholder:text-gray-300 placeholder:font-bold"
                                        value={form.title}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Cuadrícula: Categoria y Condición */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Categoría</label>
                                        <div className="relative">
                                            <select
                                                name="category"
                                                value={form.category}
                                                onChange={handleChange}
                                                className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    {CATEGORIES.find(c => c.name === form.category)?.sub ? (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Subcategoría *</label>
                                            <div className="relative">
                                                <select
                                                    name="subcategory"
                                                    value={form.subcategory}
                                                    onChange={handleChange}
                                                    className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>Seleccionar Subcategoría</option>
                                                    {CATEGORIES.find(c => c.name === form.category)?.sub.map(sub => (
                                                        <option key={sub} value={sub}>{sub}</option>
                                                    ))}
                                                </select>
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Estado General</label>
                                            <div className="relative">
                                                <select
                                                    name="condition"
                                                    value={form.condition}
                                                    onChange={handleChange}
                                                    className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="new">Nuevo en caja sellada</option>
                                                    <option value="like_new">Como Nuevo (Poco uso)</option>
                                                    <option value="good">Buen estado (Detalles leves)</option>
                                                    <option value="used">Usado (Marcas visibles)</option>
                                                    <option value="repair">Para reparar / Repuestos</option>
                                                    <option value="digital">Producto 100% Digital</option>
                                                    <option value="service">Servicio Profesional</option>
                                                </select>
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Fila extra si hubo subcategoria para tapar Condición */}
                                {CATEGORIES.find(c => c.name === form.category)?.sub && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Estado General</label>
                                        <div className="relative">
                                            <select
                                                name="condition"
                                                value={form.condition}
                                                onChange={handleChange}
                                                className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="new">Nuevo en caja sellada</option>
                                                <option value="like_new">Como Nuevo (Poco uso)</option>
                                                <option value="good">Buen estado / Detalles leves</option>
                                                <option value="used">Usado / Marcas visibles</option>
                                                <option value="repair">Para reparar / Repuestos</option>
                                                <option value="digital">Producto 100% Digital</option>
                                                <option value="service">Servicio</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                )}

                                {/* Detalles Opcionales (Marca/Color) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Marca (Opcional)</label>
                                        <input
                                            name="brand"
                                            value={form.brand}
                                            onChange={handleChange}
                                            placeholder="Ej: Samsung"
                                            className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all placeholder:text-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Color (Opcional)</label>
                                        <input
                                            name="color"
                                            value={form.color}
                                            onChange={handleChange}
                                            placeholder="Ej: Negro"
                                            className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Descripción Completa</label>
                                    <textarea
                                        name="description"
                                        placeholder="Características principales, si tiene accesorios, si tiene roturas, etc."
                                        className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-6 min-h-[140px] font-bold text-dark-800 outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-400 transition-all placeholder:text-gray-300 resize-none"
                                        value={form.description}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 3: PRECIO Y LOGISTICA */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8 flex-1">
                            <div>
                                <h2 className="text-3xl lg:text-4xl font-black text-dark-800 uppercase tracking-tighter mb-2">Dinero y Envío</h2>
                                <p className="text-gray-400 mb-8 font-bold text-sm tracking-tight">Estás a un click de poner tu oferta en línea.</p>
                            </div>

                            {/* CAJA DE PRECIO DESTACADA */}
                            <div className="bg-primary-50 p-8 rounded-[32px] border-2 border-primary-200 mb-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-vibrant/5 rounded-full blur-[40px] -mr-20 -mt-20 pointer-events-none" />
                                <label className="block text-[10px] font-black uppercase text-primary-vibrant tracking-widest mb-3 relative z-10">Precio de Venta</label>
                                <div className="flex items-center gap-2 relative z-10">
                                    <span className="text-4xl lg:text-5xl font-black text-primary-vibrant">$</span>
                                    <input
                                        type="text"
                                        className="bg-transparent border-none text-4xl lg:text-5xl font-black text-primary-vibrant outline-none w-full placeholder:text-primary-200"
                                        placeholder="0,00"
                                        value={form.price}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^0-9,]/g, '');
                                            if ((rawValue.match(/,/g) || []).length > 1) return;
                                            const parts = rawValue.split(',');
                                            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                            const formatted = parts.join(',');
                                            if (formatted !== form.price) setForm(prev => ({ ...prev, price: formatted }));
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-primary-800/60 uppercase tracking-widest mt-4 relative z-10">Efectivo directo a tu CBU. 100% Garantizado.</p>
                            </div>

                            {/* CANTIDAD / STOCK */}
                            <div className="bg-white border border-light-200 p-6 rounded-[32px] flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 bg-light-50 rounded-2xl flex items-center justify-center border border-light-100 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-vibrant transition-colors">
                                        <span className="material-symbols-outlined font-black">inventory_2</span>
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-dark-800">Cantidad Disponible</h4>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">¿Cuántas unidades tienes para vender?</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) })); }}
                                        className="size-10 bg-light-50 border border-light-100 rounded-xl flex items-center justify-center text-dark-800 hover:bg-light-100 active:scale-95 transition-all font-black"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        className="w-12 text-center font-black text-dark-800 outline-none"
                                    />
                                    <button
                                        onClick={(e) => { e.preventDefault(); setForm(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 })); }}
                                        className="size-10 bg-light-50 border border-light-100 rounded-xl flex items-center justify-center text-dark-800 hover:bg-light-100 active:scale-95 transition-all font-black"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* MÉTODOS DE ENTREGA */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-2">¿Cómo entregas el producto?</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { id: 'en_mano', label: 'En persona', sub: 'Punto de encuentro' },
                                        { id: 'domicilio', label: 'Envío', sub: 'A domicilio' },
                                        { id: 'correo_argentino', label: 'Correo Arg', sub: 'Servicio Postal' },
                                        { id: 'acordar', label: 'Acordar', sub: 'Coordinar chat' }
                                    ].map(method => (
                                        <div
                                            key={method.id}
                                            onClick={() => {
                                                const current = form.deliveryMethods;
                                                const updated = current.includes(method.id) ? current.filter(m => m !== method.id) : [...current, method.id];
                                                if (updated.length > 0) setForm({ ...form, deliveryMethods: updated });
                                            }}
                                            className={`cursor-pointer border-2 rounded-2xl p-4 flex flex-col justify-center items-center text-center transition-all ${form.deliveryMethods.includes(method.id) ? 'border-primary-vibrant bg-white shadow-md' : 'border-light-200 bg-light-50 hover:bg-light-100 hover:border-light-300'}`}
                                        >
                                            <span className={`material-symbols-outlined text-2xl mb-1 ${form.deliveryMethods.includes(method.id) ? 'text-primary-vibrant' : 'text-gray-400'}`}>
                                                {method.id === 'en_mano' ? 'handshake' : method.id === 'domicilio' ? 'local_shipping' : method.id === 'correo_argentino' ? 'mark_email_read' : 'chat'}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${form.deliveryMethods.includes(method.id) ? 'text-dark-800' : 'text-gray-500'}`}>{method.label}</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{method.sub}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* OFERTA RELAMPAGO (Destacado) */}
                            <div className="mt-8 border border-light-200 bg-white rounded-3xl p-6 relative overflow-hidden group">
                                {form.isFeatured && (
                                    <div className="absolute inset-0 bg-primary-50/50 pointer-events-none" />
                                )}
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${form.isFeatured ? 'bg-primary-vibrant text-white shadow-lg shadow-primary-500/20' : 'bg-light-50 border border-light-200 text-gray-400 group-hover:bg-light-100'}`}>
                                            <span className="material-symbols-outlined font-black">bolt</span>
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-black uppercase tracking-tight ${form.isFeatured ? 'text-primary-vibrant' : 'text-dark-800'}`}>Oferta Relámpago</h4>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Visibilidad Premium en la portada {form.isFeatured ? '¡Activada!' : ''}</p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setForm(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                                        className={`w-14 h-8 rounded-full relative cursor-pointer transition-all duration-300 ${form.isFeatured ? 'bg-primary-vibrant shadow-md shadow-primary-vibrant/30' : 'bg-light-200'}`}
                                    >
                                        <div className={`absolute top-1 size-6 bg-white rounded-full shadow-sm transition-all duration-300 ${form.isFeatured ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}


                    {/* BOTONES DE NAVEGACIÓN (Fijos al final) */}
                    <div className="flex items-center gap-4 mt-12 pt-8 border-t border-light-100/50 z-20 bg-white">
                        {step > 1 && (
                            <button
                                onClick={prevStep}
                                disabled={loading}
                                className="px-6 py-5 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-light-50 hover:text-dark-800 transition-all border border-transparent disabled:opacity-50"
                            >
                                Volver
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                if (step === 3) {
                                    handleSubmit(e);
                                } else {
                                    nextStep();
                                }
                            }}
                            disabled={
                                loading ||
                                (step === 1 && previews.length === 0) ||
                                (step === 2 && (!form.title || (CATEGORIES.find(c => c.name === form.category)?.sub && !form.subcategory))) ||
                                (step === 3 && (!form.price || form.price === '0' || form.price === '0,00' || form.price === ''))
                            }
                            className="flex-1 bg-primary-vibrant text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] lg:text-[11px] shadow-xl shadow-primary-vibrant/20 hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-primary-vibrant flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    {uploadProgress || 'Procesando...'}
                                </>
                            ) : step === 3 ? (
                                editId ? 'Guardar Cambios' : 'Confirmar & Publicar'
                            ) : (
                                'Continuar'
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
