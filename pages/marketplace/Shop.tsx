import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemsBySeller, ItemData } from '../../lib/items';
import { getUserProfile, UserProfile } from '../../lib/users';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import { useNotification } from '../../context/NotificationContext';
import { checkIsFollowing, toggleFollow } from '../../lib/interactions';
import { useAuth } from '../../lib/auth';

const Shop = () => {
    const { uid } = useParams<{ uid: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotification();

    const [seller, setSeller] = useState<UserProfile | null>(null);
    const [products, setProducts] = useState<(ItemData & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const fetchShopData = async () => {
            if (!uid) return;
            setLoading(true);
            try {
                const [sellerData, productsData] = await Promise.all([
                    getUserProfile(uid),
                    getItemsBySeller(uid)
                ]);

                if (sellerData) {
                    setSeller(sellerData);
                    setProducts(productsData);

                    if (user) {
                        const following = await checkIsFollowing(user.uid, uid);
                        setIsFollowing(following);
                    }
                } else {
                    notify({ type: 'error', title: 'Tienda no encontrada', message: 'El vendedor no existe o ha sido desactivado.', icon: 'error' });
                    navigate('/');
                }
            } catch (error) {
                console.error("Error fetching shop data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchShopData();
    }, [uid, user, navigate, notify]);

    const handleFollow = async () => {
        if (!user) {
            notify({ type: 'error', title: 'Acceso Denegado', message: 'Inicia sesión para seguir a este vendedor.', icon: 'lock' });
            return;
        }
        if (user.uid === uid) return;

        try {
            const result = await toggleFollow(user.uid, uid!);
            setIsFollowing(result.isFollowing);
            notify({
                type: 'success',
                title: result.isFollowing ? 'Siguiendo' : 'Dejaste de seguir',
                message: result.isFollowing ? `Ahora sigues a ${seller?.displayName}` : `Ya no sigues a ${seller?.displayName}`,
                icon: 'person_add'
            });
        } catch (error) {
            notify({ type: 'error', title: 'Error', message: 'No se pudo procesar la acción.', icon: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="max-w-[1440px] mx-auto px-6 py-20">
                <div className="animate-pulse space-y-10">
                    <div className="h-64 bg-light-100 rounded-[40px]" />
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!seller) return null;

    const rating = seller.reputation?.averageRating || 0;

    return (
        <div className="bg-light-50 min-h-screen">
            {/* SHOP HEADER */}
            <div className="relative overflow-hidden bg-dark-900 pt-32 pb-20">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-600 rounded-full blur-[150px] opacity-20" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-red-600 rounded-full blur-[120px] opacity-10" />
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-10">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary-vibrant rounded-[40px] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <img
                                src={seller.avatar || `https://ui-avatars.com/api/?name=${seller.displayName}&background=random`}
                                alt={seller.displayName}
                                className="size-40 md:size-48 rounded-[40px] object-cover border-4 border-white relative z-10 shadow-2xl"
                            />
                            <div className="absolute -bottom-4 -right-4 size-14 bg-white rounded-2xl flex items-center justify-center shadow-xl z-20 border border-light-100">
                                <span className="material-symbols-outlined text-primary-vibrant font-black text-3xl">verified</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                                    {seller.displayName}
                                </h1>
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <button
                                        onClick={handleFollow}
                                        className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isFollowing
                                            ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                                            : 'bg-primary-vibrant text-white shadow-xl shadow-primary-vibrant/20 hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        {isFollowing ? 'Siguiendo' : 'Seguir Vendedor'}
                                    </button>
                                    <button className="size-11 bg-white/10 text-white rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all">
                                        <span className="material-symbols-outlined text-sm">share</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                {/* Rating */}
                                <div className="flex items-center gap-2">
                                    <div className="flex text-yellow-400">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <span key={s} className="material-symbols-outlined text-lg fill-current">
                                                {rating >= s ? 'star' : rating >= s - 0.5 ? 'star_half' : 'star_outline'}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-white font-black text-sm">{rating.toFixed(1)}</span>
                                    <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest">({seller.reputation?.totalReviews || 0} reviews)</span>
                                </div>

                                <div className="h-4 w-px bg-white/10 hidden md:block" />

                                <div className="flex items-center gap-2 text-white/60">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {seller.location?.city}, {seller.location?.state}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-400 font-bold text-sm max-w-xl line-clamp-2 italic">
                                "{seller.bio || 'Este vendedor prefiere mantener el misterio, pero sus activos hablan por sí solos.'}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCT GRID SECTION */}
            <main className="max-w-7xl mx-auto px-6 py-20">
                <div className="flex items-end justify-between mb-12 border-b border-light-200 pb-8">
                    <div>
                        <h2 className="text-3xl font-black text-dark-800 tracking-tight flex items-center gap-4">
                            Catálogo Premium
                            <span className="bg-primary-50 text-primary-vibrant text-[10px] px-3 py-1 rounded-full border border-primary-100">
                                {products.length} ACTIVOS
                            </span>
                        </h2>
                        <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">Todos los ítems verificados con protección Escrow</p>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar en la tienda..."
                                className="bg-white border border-light-200 rounded-2xl py-3 pl-6 pr-12 font-bold text-xs outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-vibrant transition-all w-64"
                            />
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                        </div>
                    </div>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                ) : (
                    <div className="py-40 text-center bg-white rounded-[40px] border-2 border-dashed border-light-200">
                        <div className="size-20 bg-light-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-4xl text-gray-300">inventory_2</span>
                        </div>
                        <h3 className="text-2xl font-black text-dark-800 mb-2">Tienda en Mantenimiento</h3>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Este vendedor no tiene activos publicados actualmente</p>
                    </div>
                )}

                {/* Seller Credentials Mockup */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: 'Identidad Verificada', icon: 'shield_person', text: 'Documentación validada por el NODE-DEOP.' },
                        { title: 'Escrow Force', icon: 'lock', text: 'Transacciones 100% protegidas mediante contratos inteligentes.' },
                        { title: 'Soporte Directo', icon: 'support_agent', text: 'Asistencia prioritaria en mediaciones de este comercio.' }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white p-8 rounded-[32px] border border-light-200 shadow-sm flex flex-col items-center text-center group hover:shadow-premium transition-all">
                            <div className="size-16 bg-light-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary-vibrant group-hover:text-white transition-colors duration-500">
                                <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-widest text-dark-800 mb-2">{feature.title}</h4>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight">{feature.text}</p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default Shop;
