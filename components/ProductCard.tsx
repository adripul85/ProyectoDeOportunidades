import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ItemData } from '../lib/items';

interface ProductCardProps {
    product: ItemData & { id: string };
    location?: string;
    isVerified?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, location, isVerified }) => {
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

    return (
        <Link
            to={`/product/${product.id}`}
            className="group bg-white rounded-3xl border border-light-200 overflow-hidden hover:shadow-premium transition-all flex flex-col h-full"
        >
            <div className="aspect-square bg-light-100 relative overflow-hidden">
                <img
                    src={product.images?.[0] || 'https://picsum.photos/400/400?tech'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />

                {/* Badge de Visitas (Bounce Effect) */}
                {product.views && product.views >= 5 && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: 1
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 3
                        }}
                        className="absolute top-4 left-4 z-10"
                    >
                        <div className="bg-[#FF7043] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/30 backdrop-blur-sm">
                            <span className="material-symbols-outlined text-sm font-black">visibility</span>
                            <span className="text-[10px] font-black tracking-tight whitespace-nowrap">
                                ¡{product.views} personas lo vieron!
                            </span>
                        </div>
                        {/* Triangulito del globo (opcional para estilo tool-tip como en la foto) */}
                        <div className="w-2 h-2 bg-[#FF7043] rotate-45 mx-auto -mt-1 shadow-md"></div>
                    </motion.div>
                )}

                <button
                    className="absolute top-4 right-4 size-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-dark-800 hover:text-primary-vibrant transition-colors shadow-sm z-10"
                    onClick={(e) => {
                        e.preventDefault();
                    }}
                >
                    <span className="material-symbols-outlined text-xl">favorite</span>
                </button>

                {isVerified && !product.views && (
                    <div className="absolute top-4 left-4 size-8 bg-white/95 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/20 animate-in zoom-in duration-700 z-10">
                        <span className="material-symbols-outlined text-primary-vibrant text-lg font-black">verified</span>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="mb-3">
                    <span className="text-[10px] font-black text-gray-400 bg-light-100 px-2 py-1 rounded-md uppercase tracking-wider">
                        {product.condition === 'new' ? 'Nuevo' :
                            product.condition === 'like_new' ? 'Como nuevo' :
                                product.condition === 'good' ? 'Buen estado' : 'Detalles de uso'}
                    </span>
                </div>

                <h3 className="text-base font-bold text-dark-800 line-clamp-2 mb-2 group-hover:text-primary-vibrant transition-colors h-12">
                    {product.title}
                </h3>

                <p className="text-2xl font-black text-dark-900 mb-3">
                    ${product.price.toLocaleString()} <span className="text-[11px] font-black text-gray-400 ml-1 uppercase">ARS</span>
                </p>

                <div className="mt-auto pt-4 border-t border-light-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <p className="text-[11px] font-bold tracking-tight">
                            {product.location || location || 'Ubicación no especificada'}
                        </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-light-50/50 p-2 rounded-xl">
                        <span>Publicado {getRelativeTime(product.createdAt)}</span>
                        <span className="text-primary-vibrant opacity-50">{product.category}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
