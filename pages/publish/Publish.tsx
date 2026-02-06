import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { publishItem, ItemData, CATEGORIES, getProduct, updateItem } from '../../lib/items';
import { useNotification } from '../../App';
import { useAuth } from '../../lib/auth';
import { uploadFile } from '../../lib/storage';

export default function Publish() {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const { user } = useAuth();
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
        category: 'Tecnología',
        condition: 'like_new' as const,
        brand: '',
        color: '',
        shippingAvailable: true
    });

    // Load existing data if editing
    React.useEffect(() => {
        if (editId) {
            setLoading(true);
            getProduct(editId).then(item => {
                if (item) {
                    setForm({
                        title: item.title,
                        price: item.price.toString(),
                        description: item.description,
                        category: item.category,
                        condition: item.condition,
                        brand: item.brand || '',
                        color: item.color || '',
                        shippingAvailable: item.shippingAvailable !== undefined ? item.shippingAvailable : true
                    });
                    setExistingImages(item.images || []);
                    setPreviews(item.images || []);
                }
                setLoading(false);
            });
        }
    }, [editId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setForm({ ...form, [e.target.name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file as Blob));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => {
            const updated = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index]);
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!form.title || !form.price) {
                notify({ type: 'warning', title: 'Datos Faltantes', message: 'Por favor, proporciona un título y precio para tu ítem.', icon: 'edit' });
                return;
            }

            const parsedPrice = parseFloat(form.price);
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

            setUploadProgress('Finalizando...');

            let result;
            const finalImages = [...existingImages, ...uploadedImages];

            if (editId) {
                // Update existing item
                const updateResult = await updateItem(editId, {
                    title: form.title,
                    price: parsedPrice,
                    description: form.description,
                    category: form.category,
                    condition: form.condition,
                    brand: form.brand,
                    color: form.color,
                    shippingAvailable: form.shippingAvailable,
                    images: finalImages.length > 0 ? finalImages : ["https://picsum.photos/400/400?random=1"]
                });
                result = { success: updateResult.success, id: editId };
            } else {
                // Publish new item
                result = await publishItem({
                    title: form.title,
                    price: parsedPrice,
                    description: form.description,
                    category: form.category,
                    condition: form.condition,
                    brand: form.brand,
                    color: form.color,
                    shippingAvailable: form.shippingAvailable,
                    images: finalImages.length > 0 ? finalImages : ["https://picsum.photos/400/400?random=1"],
                    sellerId: user.uid
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

    return (
        <div className="bg-light-50 min-h-screen">
            {/* Header / Top Navigation Mockup from Image */}
            <div className="max-w-[1440px] mx-auto px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* --- LEFT COLUMN: INPUT FORM --- */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-dark-800 tracking-tighter">{editId ? 'Editar Publicación' : 'Crear Nueva Publicación'}</h1>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                            {editId ? 'Actualiza los detalles de tu producto existente.' : 'Los ítems publicados en el Marketplace son visibles para todos.'}
                        </p>
                    </div>

                    {/* Photo Upload Section */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-dark-800 uppercase tracking-widest pl-1">Fotos</h3>
                        <div className="bg-white border-2 border-dashed border-light-200 rounded-[32px] p-10 text-center space-y-5 transition-all hover:bg-white/50 hover:border-primary-200 group relative">
                            <div className="size-16 bg-primary-50 rounded-2xl mx-auto flex items-center justify-center transition-transform group-hover:scale-110">
                                <span className="material-symbols-outlined text-3xl text-primary-vibrant font-black">add_a_photo</span>
                            </div>
                            <div>
                                <h4 className="font-black text-dark-800 mb-1">Agregar Fotos</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Arrastra y suelta o haz clic para subir (hasta 10)</p>
                            </div>
                            <label className="inline-block">
                                <span className="bg-primary-vibrant text-white px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest cursor-pointer hover:shadow-lg shadow-primary-vibrant/20 transition-all active:scale-95">
                                    Seleccionar Archivos
                                </span>
                                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>

                            {/* Simple Preview for the Left Side */}
                            {previews.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-6">
                                    {previews.slice(0, 4).map((p, i) => (
                                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-light-100 group/item">
                                            <img src={p} className="w-full h-full object-cover" />
                                            <button onClick={() => removeFile(i)} className="absolute inset-0 bg-red-600/60 opacity-0 group-hover/item:opacity-100 flex items-center justify-center text-white">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Listing Details */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
                        <h3 className="text-sm font-black text-dark-800 uppercase tracking-widest pl-1">Detalles de la Publicación</h3>

                        <div className="space-y-6">
                            {/* Title Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Título</label>
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="¿Qué estás vendiendo?"
                                    className="w-full bg-white border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-300"
                                />
                            </div>

                            {/* Price Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Precio</label>
                                <div className="relative">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-800/40 font-black">$</span>
                                    <input
                                        name="price"
                                        type="number"
                                        value={form.price}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full bg-white border border-light-200 rounded-2xl py-4 pl-12 pr-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Category & Condition Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Categoría</label>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            value={form.category}
                                            onChange={handleChange}
                                            className="w-full bg-white border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none appearance-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Condición</label>
                                    <div className="relative">
                                        <select
                                            name="condition"
                                            value={form.condition}
                                            onChange={handleChange}
                                            className="w-full bg-white border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="new">Nuevo</option>
                                            <option value="like_new">Como Nuevo</option>
                                            <option value="good">Bueno</option>
                                            <option value="fair">Regular</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                            </div>

                            {/* Brand & Color Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Marca</label>
                                    <input
                                        name="brand"
                                        value={form.brand}
                                        onChange={handleChange}
                                        placeholder="Ej: Apple, Nike"
                                        className="w-full bg-white border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Color</label>
                                    <input
                                        name="color"
                                        value={form.color}
                                        onChange={handleChange}
                                        placeholder="Ej: Rojo, Negro"
                                        className="w-full bg-white border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Description Input */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">Descripción</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe lo que vendes, incluye cualquier desperfecto..."
                                    className="w-full bg-white border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-300 resize-none"
                                />
                            </div>
                        </div>

                        {/* Shipping Toggle */}
                        <div className="bg-white p-6 rounded-2xl border border-light-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-black text-dark-800 text-sm mb-1">Habilitar Envíos</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">¿Estás dispuesto a enviar este producto?</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="shippingAvailable"
                                        checked={form.shippingAvailable}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-vibrant"></div>
                                </label>
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 bg-primary-vibrant text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-vibrant/20 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                        {uploadProgress || (editId ? 'Guardando...' : 'Publicando...')}
                                    </>
                                ) : (editId ? 'Guardar Cambios' : 'Publicar')}
                            </button>
                            <button className="flex-1 bg-light-200 text-dark-800 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:bg-light-300 active:scale-95">
                                Guardar Borrador
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: LIVE PREVIEW --- */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="flex items-center justify-between pl-2">
                        <h2 className="text-2xl font-black text-dark-800 tracking-tighter">Vista Previa</h2>
                        <div className="bg-primary-50 text-primary-vibrant px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest border border-primary-100 flex items-center gap-2">
                            <div className="size-1.5 bg-primary-vibrant rounded-full animate-pulse" />
                            Modo Borrador
                        </div>
                    </div>

                    <div className="bg-white rounded-[40px] shadow-premium overflow-hidden border border-light-200/50 flex flex-col md:flex-row h-full min-h-[500px]">
                        {/* Preview Media Section */}
                        <div className="md:w-[55%] bg-light-50 flex flex-col p-8">
                            <div className="flex-1 flex items-center justify-center relative rounded-[32px] overflow-hidden border-2 border-dashed border-light-200/50 bg-white shadow-inner">
                                {previews.length > 0 ? (
                                    <img src={previews[0]} className="w-full h-full object-cover animate-in fade-in duration-500" />
                                ) : (
                                    <div className="text-center text-gray-300 flex flex-col items-center gap-4">
                                        <div className="size-20 bg-light-50 rounded-3xl flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-4xl">landscape</span>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Aún no hay fotos</p>
                                    </div>
                                )}
                            </div>

                            {/* Smaller Preview Thumbs */}
                            <div className="grid grid-cols-3 gap-6 mt-8">
                                {[0, 1, 2].map(idx => (
                                    <div key={idx} className="aspect-square rounded-2xl bg-white border border-light-200/50 relative overflow-hidden group">
                                        {previews[idx + 1] && (
                                            <img src={previews[idx + 1]} className="w-full h-full object-cover" />
                                        )}
                                        {!previews[idx + 1] && (
                                            <div className="absolute inset-0 bg-light-50/50 flex items-center justify-center" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Preview Info Section */}
                        <div className="md:w-[45%] p-10 flex flex-col justify-between">
                            <div>
                                <h1 className="text-4xl font-black text-dark-800 tracking-tighter mb-4 line-clamp-2">
                                    {form.title || 'Tu Título Aquí'}
                                </h1>
                                <p className="text-3xl font-black text-primary-vibrant mb-10">
                                    ${form.price ? parseFloat(form.price).toLocaleString() : '0.00'}
                                </p>

                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2 leading-none">Condición</p>
                                        <p className="text-sm font-black text-dark-800 uppercase tracking-tight">
                                            {form.condition === 'new' ? 'Nuevo' :
                                                form.condition === 'like_new' ? 'Como Nuevo' :
                                                    form.condition === 'good' ? 'Bueno' :
                                                        form.condition === 'fair' ? 'Regular' : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2 leading-none">Categoría</p>
                                        <p className="text-sm font-black text-dark-800 uppercase tracking-tight">{form.category || '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2 leading-none">Descripción</p>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed line-clamp-4 italic">
                                            {form.description || 'Sin descripción aún.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-light-100 space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-light-50 rounded-2xl border border-light-200/50">
                                    <div className="size-10 rounded-full bg-primary-vibrant text-white flex items-center justify-center font-black">
                                        <span className="material-symbols-outlined text-lg">person</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-dark-800 truncate">Información del Vendedor</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Se unió en 2023</p>
                                    </div>
                                </div>
                                <button className="w-full h-14 bg-light-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] cursor-not-allowed border border-light-200/50">
                                    Enviar Mensaje
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pro Tip Banner */}
                    <div className="bg-primary-50 p-6 rounded-[28px] border border-primary-100 flex items-center gap-6 animate-in slide-in-from-right-4 duration-700 delay-300">
                        <div className="size-12 bg-primary-vibrant text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-vibrant/20">
                            <span className="material-symbols-outlined font-black">lightbulb</span>
                        </div>
                        <p className="text-[11px] font-bold text-primary-800 uppercase tracking-wide leading-relaxed">
                            <span className="font-black text-primary-vibrant mr-2">Pro-tip:</span>
                            Las publicaciones con múltiples fotos desde diferentes ángulos se venden <span className="text-primary-vibrant font-black">2.5x más rápido</span>. Asegúrate de capturar características únicas o desgastes.
                        </p>
                    </div>
                </div>
            </div>
        </div >
    );
}
