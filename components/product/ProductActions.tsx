import React from 'react';
import { useAuth } from '../../lib/auth';

interface ProductActionsProps {
    onSave: () => void;
    onAlert: () => void;
    onReport: () => void;
    onShare: () => void;
    isSaved: boolean;
    hasAlert: boolean;
}

const ProductActions: React.FC<ProductActionsProps> = ({
    onSave,
    onAlert,
    onReport,
    onShare,
    isSaved,
    hasAlert
}) => {
    return (
        <div className="flex items-center gap-4 mb-10">
            <button
                onClick={onSave}
                className={`size-14 rounded-2xl border-2 transition-all flex items-center justify-center shadow-premium ${isSaved ? 'bg-primary-vibrant border-primary-vibrant text-white shadow-lg shadow-primary-vibrant/20' : 'bg-white border-light-200 text-dark-800 hover:border-dark-800/10'}`}
                title={isSaved ? "Guardado" : "Guardar para después"}
            >
                <span className={`material-symbols-outlined text-2xl font-black ${isSaved ? 'fill-1' : ''}`}>favorite</span>
            </button>
            <button
                onClick={onAlert}
                className={`size-14 rounded-2xl border-2 transition-all flex items-center justify-center shadow-premium ${hasAlert ? 'bg-primary-50 border-primary-vibrant text-primary-vibrant shadow-lg shadow-primary-vibrant/10' : 'bg-white border-light-200 text-dark-800 hover:border-dark-800/10'}`}
                title="Alertas de Protocolo"
            >
                <span className={`material-symbols-outlined text-2xl font-black ${hasAlert ? 'fill-1' : ''}`}>notifications</span>
            </button>
            <button
                onClick={onShare}
                className="h-14 px-8 rounded-2xl border-2 border-light-200 bg-white text-dark-800 hover:border-dark-800/10 transition-all font-black flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] shadow-premium group"
                title="Compartir Protocolo"
            >
                <span className="material-symbols-outlined text-xl font-black group-hover:rotate-12 transition-transform">share</span>
                Compartir
            </button>
            <div className="flex-1"></div>
            <button
                onClick={onReport}
                className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-red-500 transition-all group"
            >
                <span className="material-symbols-outlined text-lg font-black group-hover:shake transition-all text-gray-300 group-hover:text-red-400">flag</span>
                Reportar Brecha
            </button>
        </div>
    );
};

export default ProductActions;
