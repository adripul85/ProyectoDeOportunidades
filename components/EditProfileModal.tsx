import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { updateUserProfile, UserProfile } from '../lib/users';
import { useNotification } from '../App';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: UserProfile;
}

export default function EditProfileModal({ isOpen, onClose, currentProfile }: EditProfileModalProps) {
    const { notify } = useNotification();
    const [formData, setFormData] = useState({
        displayName: currentProfile.displayName || '',
        bio: currentProfile.bio || '',
        phone: currentProfile.phone || '',
        city: currentProfile.location?.city || '',
        state: currentProfile.location?.state || '',
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const result = await updateUserProfile(currentProfile.uid, {
            displayName: formData.displayName,
            bio: formData.bio,
            phone: formData.phone,
            location: {
                city: formData.city,
                state: formData.state,
            }
        });

        setLoading(false);

        if (result.success) {
            notify({
                type: 'success',
                title: 'Identidad Actualizada',
                message: 'Tus cambios de perfil han sido sincronizados de forma segura.',
                icon: 'check_circle'
            });
            onClose();
            // Reload page to see changes (or use a global state update if we had one)
            window.location.reload();
        } else {
            notify({
                type: 'error',
                title: 'Fallo de Sincronización',
                message: 'No pudimos actualizar tu perfil en este momento.',
                icon: 'error'
            });
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-dark-900/40 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white max-w-lg w-full rounded-[40px] shadow-premium overflow-hidden animate-in zoom-in duration-500 border border-light-200/50">
                <div className="p-12">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-dark-800 uppercase tracking-tight">Gestión de Identidad</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-2">Ajusta tu perfil público y metadatos de contacto</p>
                        </div>
                        <button onClick={onClose} className="size-12 bg-light-100 hover:bg-light-200 text-dark-800 rounded-2xl flex items-center justify-center transition-all group">
                            <span className="material-symbols-outlined font-black group-hover:rotate-90 transition-transform">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 ml-2">Designación Pública</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full bg-light-50 border border-light-200 rounded-2xl py-5 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-sm transition-all"
                                placeholder="Nombre Completo o Alias"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 ml-2">Bio y Resumen Profesional</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full bg-light-50 border border-light-200 rounded-2xl py-5 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-sm transition-all h-32 resize-none"
                                placeholder="Describe brevemente tu experiencia o antecedentes..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 ml-2">Ciudad</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full bg-light-50 border border-light-200 rounded-2xl py-5 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-sm transition-all"
                                    placeholder="Ciudad"
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 ml-2">Estado / Región</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full bg-light-50 border border-light-200 rounded-2xl py-5 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-sm transition-all"
                                    placeholder="Estado"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-3 ml-2">Enlace de Comunicación (Teléfono)</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-light-50 border border-light-200 rounded-2xl py-5 px-8 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none font-bold text-sm transition-all"
                                placeholder="Ejemplo: +1 234 567 8900"
                            />
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button type="button" onClick={onClose} className="flex-1 px-8 py-5 border-2 border-light-200 text-gray-400 font-black rounded-3xl hover:bg-light-50 transition-all text-[10px] uppercase tracking-[0.2em]">Cancelar</button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-dark-800 text-white font-black py-5 rounded-3xl hover:bg-dark-900 transition-all text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-dark-800/10 active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Sincronizando...' : 'Guardar Meta-Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
