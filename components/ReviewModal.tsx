import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { createReview } from '../lib/reviews';
import { useNotification } from '../context/NotificationContext';
import RatingStars from './RatingStars';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    itemId: string;
    itemTitle: string;
    sellerId: string;
    onReviewSubmitted?: () => void;
}

export default function ReviewModal({
    isOpen,
    onClose,
    transactionId,
    itemId,
    itemTitle,
    sellerId,
    onReviewSubmitted
}: ReviewModalProps) {
    const { user, userProfile } = useAuth();
    const { notify } = useNotification();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            notify({ type: 'error', title: 'Autenticación Requerida', message: 'Debes iniciar sesión para enviar reseñas.', icon: 'lock' });
            return;
        }

        if (rating === 0) {
            notify({ type: 'warning', title: 'Calificación Requerida', message: 'Por favor selecciona al menos una estrella.', icon: 'star' });
            return;
        }

        setSubmitting(true);

        const result = await createReview({
            transactionId,
            itemId,
            sellerId,
            buyerId: user.uid,
            buyerName: userProfile?.displayName || user.displayName || 'Anonymous User',
            buyerAvatar: userProfile?.avatar || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}`,
            rating,
            comment: comment.trim() || undefined
        });

        setSubmitting(true); // Keep it busy for a sec for effect

        if (result.success) {
            notify({ type: 'success', title: 'Protocolo Grabado', message: 'Tu feedback ayuda a asegurar el mercado.', icon: 'star' });
            onReviewSubmitted?.();
            onClose();
            // Reset form
            setRating(0);
            setComment('');
        } else {
            notify({ type: 'error', title: 'Error de Sincronización', message: result.error as string || 'Fallo al transmitir reseña.', icon: 'error' });
        }
    };

    const handleClose = () => {
        if (!submitting) {
            onClose();
            setRating(0);
            setComment('');
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-dark-900/40 backdrop-blur-md" onClick={handleClose}>
            <div className="bg-white rounded-[40px] shadow-premium max-w-lg w-full p-12 animate-in zoom-in duration-500 border border-light-200/50" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-start justify-between mb-10">
                    <div>
                        <h2 className="text-2xl font-black text-dark-800 uppercase tracking-tight">Evaluar Comerciante</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Protocolo: {itemTitle}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={submitting}
                        className="size-10 bg-light-100 hover:bg-light-200 text-dark-800 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined font-black">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Rating */}
                    <div className="bg-light-50/50 rounded-3xl p-8 border border-light-100/50">
                        <label className="block text-[9px] font-black uppercase tracking-[0.4em] text-gray-400 mb-6 text-center">
                            Calificación de Estética y Rendimiento
                        </label>
                        <div className="flex justify-center flex-col items-center gap-4">
                            <RatingStars
                                rating={rating}
                                size="lg"
                                interactive
                                onRate={setRating}
                            />
                            <div className="h-6">
                                {rating > 0 && (
                                    <p className="text-[10px] font-black text-primary-vibrant uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-1">
                                        {rating === 1 && 'Fallo Crítico'}
                                        {rating === 2 && 'Sub-óptimo'}
                                        {rating === 3 && 'Rendimiento Estándar'}
                                        {rating === 4 && 'Experiencia Premium'}
                                        {rating === 5 && 'Excelencia Sobresaliente'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4 ml-2">
                            Feedback Detallado (Opcional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Provee insights del protocolo o detalles del rendimiento del comerciante..."
                            className="w-full p-6 rounded-2xl border border-light-200 bg-light-50 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 outline-none transition-all font-bold text-sm text-dark-800 resize-none h-32"
                            maxLength={500}
                        />
                        <div className="flex items-center justify-end mt-3 px-2">
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                {comment.length} / 500 Meta-unidades
                            </span>
                        </div>
                    </div>

                    {/* Trust Badge */}
                    <div className="bg-primary-50 border border-primary-100/50 p-6 rounded-3xl flex gap-4">
                        <span className="material-symbols-outlined text-primary-vibrant font-black">verified_user</span>
                        <p className="text-[10px] font-bold text-primary-900 leading-relaxed uppercase tracking-tight opacity-70">
                            Tu feedback será hasheado y publicado en el perfil de confianza del comerciante, asistiendo a futuros participantes del Protocolo.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="flex-1 px-8 py-5 rounded-3xl border-2 border-light-200 text-gray-400 font-black hover:bg-light-50 transition-all disabled:opacity-50 text-[10px] uppercase tracking-[0.2em]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || rating === 0}
                            className="flex-1 bg-dark-800 text-white px-8 py-5 rounded-3xl font-black hover:bg-dark-900 transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-dark-800/10 active:scale-95"
                        >
                            {submitting ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sincronizando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-xl font-black">publish</span>
                                    Transmitir Reseña
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
