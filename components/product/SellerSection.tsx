
import React from 'react';
import { Link } from 'react-router-dom';

interface Seller {
    uid: string;
    displayName: string;
    avatar: string;
    reputation?: {
        averageRating: number;
        totalReviews: number;
    };
    profileComplete: boolean;
    verificationBadges?: {
        identityVerified: boolean;
    };
}

interface Props {
    seller: Seller;
}

const SellerSection: React.FC<Props> = ({ seller }) => {
    const isVerified = seller.verificationBadges?.identityVerified;

    return (
        <div className="bg-white p-10 rounded-[40px] shadow-premium border border-light-200/50 relative overflow-hidden">
            {/* Header Badge */}
            {isVerified && (
                <div className="absolute top-0 right-0 py-2 px-6 bg-primary-vibrant text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-bl-3xl border-l border-b border-primary-vibrant/10 shadow-lg animate-in slide-in-from-top duration-700">
                    Vendedor Verificado ✅
                </div>
            )}

            <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8 ml-1">Inteligencia del Comerciante</h3>

            <div className="flex items-center gap-6 mb-10">
                <Link to={`/profile/${seller.uid}`} className="shrink-0 relative group">
                    <img
                        src={seller.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.displayName)}&background=random`}
                        alt={seller.displayName}
                        className="size-20 rounded-[24px] object-cover border-4 border-light-50 shadow-premium transition-transform group-hover:scale-105 duration-500"
                    />
                    {isVerified && (
                        <div className="absolute -bottom-1 -right-1 size-7 bg-white rounded-xl flex items-center justify-center shadow-premium border border-light-100 animate-in zoom-in duration-1000">
                            <span className="material-symbols-outlined text-primary-vibrant text-lg font-black">verified</span>
                        </div>
                    )}
                </Link>
                <div className="flex-1 min-w-0">
                    <Link to={`/profile/${seller.uid}`} className="text-2xl font-black text-dark-800 hover:text-primary-vibrant truncate block transition-colors leading-tight">
                        {seller.displayName}
                    </Link>
                    <div className="flex items-center gap-3 mt-2 pl-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Socio Activo</span>
                        <div className="size-1 bg-light-200 rounded-full" />
                        <span className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest">Confianza Nivel 4</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-8 bg-light-50/50 p-6 rounded-3xl border border-light-100/50">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className="material-symbols-outlined text-amber-400 fill-1 text-base drop-shadow-sm">star</span>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">42 Protocolos Registrados</span>
                </div>
                <Link to={`/profile/${seller.uid}`} className="bg-white px-6 py-3 rounded-xl text-dark-800 text-[9px] font-black uppercase tracking-[0.2em] border border-light-200 hover:bg-light-50 transition-all shadow-sm">
                    Revisar Registros
                </Link>
            </div>

            <div className="bg-primary-50/50 rounded-3xl p-6 border border-primary-100/30 flex items-center gap-5 transition-colors hover:bg-primary-50">
                <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-primary-vibrant text-2xl font-black">bolt</span>
                </div>
                <div>
                    <p className="text-[11px] font-black text-primary-950 uppercase tracking-tight">Nodo de Respuesta Rápida</p>
                    <p className="text-[10px] font-bold text-primary-800/60 uppercase tracking-wide mt-1">Sincronización Promedio: &lt; 45 Minutos</p>
                </div>
            </div>
        </div>
    );
};

export default SellerSection;
