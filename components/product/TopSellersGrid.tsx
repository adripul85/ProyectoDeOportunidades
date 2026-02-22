import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getTopSellers, UserProfile } from '../../lib/users';
import LoadingSpinner from '../LoadingSpinner';

const TopSellersGrid: React.FC = () => {
    const [sellers, setSellers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSellers = async () => {
            const topSellers = await getTopSellers(6);
            setSellers(topSellers);
            setLoading(false);
        };
        fetchSellers();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (sellers.length === 0) return null;

    return (
        <section className="mb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-lg font-black">emoji_events</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Ranking de Confianza</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-dark-800 tracking-tighter leading-none">
                        Mejores <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 italic">Vendedores</span>
                    </h2>
                </div>
                <p className="max-w-md text-sm font-bold text-gray-400 leading-relaxed">
                    Basado en el promedio de calificaciones y satisfacción de compradores reales en la red.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellers.map((seller, index) => (
                    <motion.div
                        key={seller.uid}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white p-8 rounded-[40px] border border-light-100 shadow-premium hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                        {/* RANK BADGE */}
                        <div className="absolute top-6 right-6 size-10 bg-light-50 border border-light-100 rounded-2xl flex items-center justify-center font-black text-dark-800 text-sm group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-400 transition-colors">
                            #{index + 1}
                        </div>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="relative">
                                <div className="size-20 rounded-[30px] overflow-hidden border-4 border-light-50 group-hover:border-amber-100 transition-colors">
                                    <img
                                        src={seller.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + seller.uid}
                                        alt={seller.displayName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 size-7 bg-green-500 border-4 border-white rounded-full"></div>
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-dark-800 tracking-tight group-hover:text-amber-600 transition-colors line-clamp-1">
                                    {seller.displayName}
                                </h3>
                                <div className="flex items-center gap-2 text-amber-500 mt-1">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={`material-symbols-outlined text-sm ${Math.round(seller.reputation?.averageRating || 0) > i ? 'fill-1' : ''}`}>
                                                star
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-xs font-black">{seller.reputation?.averageRating || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-light-100">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ventas</p>
                                <p className="text-sm font-black text-dark-800">{seller.reputation?.totalReviews || 0}+ exitosas</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Desde</p>
                                <p className="text-sm font-black text-dark-800">
                                    {seller.location?.city || 'Argentina'}
                                </p>
                            </div>
                        </div>

                        <Link
                            to={`/profile/${seller.uid}`}
                            className="mt-8 w-full flex items-center justify-center gap-2 py-4 bg-light-50 hover:bg-dark-800 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            Ver Perfil Shop
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default TopSellersGrid;
