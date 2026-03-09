import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ItemData } from '../lib/items';
import CountdownTimer from './product/CountdownTimer';
import { triggerHaptic } from '../lib/haptics';
import SellerBadge from './seller/SellerBadge';
import { getUserProfile, UserProfile } from '../lib/users';

interface ProductCardProps {
    product: ItemData & { id: string };
    location?: string;
    isVerified?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, location, isVerified }) => {

    const [sellerProfile, setSellerProfile] = React.useState<UserProfile | null>(null);

    React.useEffect(() => {
        if (product.sellerId) {
            getUserProfile(product.sellerId).then(setSellerProfile);
        }
    }, [product.sellerId]);

    // Calcular tiempo transcurrido
    const getRelativeTime = (timestamp: any) => {
        if (!timestamp) return 'Recién';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Recién';
        if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
        const days = Math.floor(diffInSeconds / 86400);
        return days === 1 ? 'Hace 1 día' : `Hace ${days} días`;
    };

    const isSold = product.status === 'SOLD' || (product.quantity !== undefined && product.quantity <= 0);

    return (
        <motion.div
            whileHover={isSold ? {} : { y: -5, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`group bg-white rounded-2xl border border-light-200 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col h-full w-full ${isSold ? 'opacity-60 grayscale-[0.3]' : ''}`}
        >
            <Link
                to={`/product/${product.id}`}
                onClick={() => !isSold && triggerHaptic('light')}
                className={`flex flex-col h-full ${isSold ? 'cursor-default' : ''}`}
                onPointerDown={(e) => isSold && e.preventDefault()}
            >
                <div className="aspect-square bg-light-100 relative overflow-hidden">
                    <img
                        src={product.images?.[0] || 'https://picsum.photos/400/400?tech'}
                        alt={product.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${!isSold && 'group-hover:scale-105'}`}
                    />

                    {/* Contenedor de Badges (Top Left) */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
                        {/* Status Sold Badge */}
                        {isSold && (
                            <div className="bg-dark-900 text-white px-3 py-1.5 rounded-lg font-black text-[10px] shadow-2xl flex items-center gap-2 border border-white/20 animate-in zoom-in duration-300">
                                <span className="material-symbols-outlined text-sm">block</span>
                                VENDIDO
                            </div>
                        )}

                        {/* Globitos de Notificación (Bounce Effect) */}
                        {!isSold && product.views && product.views >= 5 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [1, 1.05, 1],
                                    opacity: 1
                                }}
                                transition={{
                                    duration: 0.5,
                                    repeat: Infinity,
                                    repeatDelay: 3
                                }}
                            >
                                <div className="bg-[#FF7043] text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg border border-white/30 backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-[12px] font-black">visibility</span>
                                    <span className="text-[9px] font-black tracking-tight whitespace-nowrap">
                                        ¡{product.views} visitas!
                                    </span>
                                </div>
                                <div className="w-1.5 h-1.5 bg-[#FF7043] rotate-45 ml-3 -mt-1 shadow-md"></div>
                            </motion.div>
                        )}

                        {/* Badge de Descuento (Universal) */}
                        {!isSold && product.oldPrice && product.oldPrice > product.price && (
                            <div className="bg-red-600 text-white px-2.5 py-1 rounded-lg font-black text-[9px] shadow-lg shadow-red-600/10 flex items-center gap-1 animate-in zoom-in duration-500">
                                <span className="material-symbols-outlined text-[12px]">trending_down</span>
                                -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                            </div>
                        )}

                        {isVerified && (
                            <div className="size-7 bg-white/95 backdrop-blur-md rounded-lg flex items-center justify-center shadow-md border border-white/20 animate-in zoom-in duration-700">
                                <span className="material-symbols-outlined text-primary-vibrant text-base font-black">verified</span>
                            </div>
                        )}

                        {/* Seller Trust Badge */}
                        {!isSold && sellerProfile && (
                            <div className="absolute top-3 right-3 z-10 animate-in fade-in slide-in-from-right-2 duration-500 delay-300">
                                <SellerBadge
                                    seller={sellerProfile}
                                    compact
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-3 flex flex-col flex-1">
                    {/* Precio - Tipografía INTER */}
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className={`text-lg font-extrabold font-sans tracking-tight ${isSold ? 'text-slate-400' : 'text-slate-900'}`}>
                            ${product.price.toLocaleString('es-AR')}
                        </span>
                        {product.oldPrice && product.oldPrice > product.price && !isSold && (
                            <span className="text-[10px] font-bold text-slate-400 line-through opacity-60">
                                ${product.oldPrice.toLocaleString('es-AR')}
                            </span>
                        )}
                    </div>

                    {/* Título - Tipografía JAKARTA */}
                    <h3 className={`text-[11px] font-medium font-display line-clamp-2 mb-2 transition-colors h-8 leading-snug ${isSold ? 'text-slate-400' : 'text-slate-600 group-hover:text-primary-vibrant'}`}>
                        {product.title}
                    </h3>

                    <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between text-[9px] text-slate-400 font-sans">
                        <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            <span className="truncate max-w-[80px] font-medium">
                                {product.location || location || 'Ubicación'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {isSold ? (
                                <span className="font-bold text-slate-300 uppercase tracking-widest text-[8px]">Agotado</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[10px] text-amber-400">star</span>
                                    <span className="font-bold">
                                        {product.sellerRating || 'Nuevo'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default ProductCard;
