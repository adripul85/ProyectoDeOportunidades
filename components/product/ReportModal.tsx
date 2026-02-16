import React, { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (reason: string, description: string) => Promise<void>;
    targetName: string;
}

const REASONS = [
    { id: 'fraud', label: 'Fraude o Estafa', icon: 'money_off' },
    { id: 'illegal', label: 'Artículo Ilegal / Prohibido', icon: 'block' },
    { id: 'spam', label: 'Spam / Publicidad Engañosa', icon: 'campaign' },
    { id: 'abusive', label: 'Contenido Abusivo u Ofensivo', icon: 'sentiment_dissatisfied' },
    { id: 'other', label: 'Otro Motivo', icon: 'help' }
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, onSubmit, targetName }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { notify } = useNotification();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReason) {
            notify({ type: 'warning', title: 'Falta Motivo', message: 'Selecciona una razón para el reporte.', icon: 'warning' });
            return;
        }

        setIsSubmitting(true);
        await onSubmit(REASONS.find(r => r.id === selectedReason)?.label || 'Otro', description);
        setIsSubmitting(false);
        onClose();
        // Reset form
        setSelectedReason('');
        setDescription('');
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-dark-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-light-200 overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="bg-red-50 p-8 border-b border-red-100 flex items-center gap-6">
                    <div className="size-16 bg-white rounded-2xl flex items-center justify-center shadow-sm text-red-500">
                        <span className="material-symbols-outlined text-3xl">report</span>
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-red-600 uppercase tracking-tight">Reportar Brecha</h3>
                        <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">
                            Estás reportando: <span className="text-red-700">{targetName}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="ml-auto text-red-300 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* Reasons Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {REASONS.map((reason) => (
                            <button
                                key={reason.id}
                                type="button"
                                onClick={() => setSelectedReason(reason.id)}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 text-left group ${selectedReason === reason.id
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-light-100 hover:border-red-200 hover:bg-red-50/50 text-gray-500'
                                    }`}
                            >
                                <span className={`material-symbols-outlined ${selectedReason === reason.id ? 'text-red-500' : 'text-gray-300 group-hover:text-red-300'}`}>
                                    {reason.icon}
                                </span>
                                <span className="text-xs font-black uppercase tracking-wider">{reason.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">
                            Detalles Adicionales (Opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-light-50 border border-light-200 rounded-2xl p-4 text-sm font-medium focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 outline-none transition-all resize-none h-32"
                            placeholder="Describe el problema encontrado para ayudar a nuestros moderadores..."
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl border-2 border-light-200 text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-light-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedReason}
                            className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                            {!isSubmitting && <span className="material-symbols-outlined text-lg">send</span>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;
