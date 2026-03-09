import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemsBySeller, ItemData } from '../../lib/items';
import { getUserProfile, UserProfile } from '../../lib/users';
import ProductCard from '../../components/ProductCard';
import SkeletonCard from '../../components/SkeletonCard';
import ReputationCard from '../../components/seller/ReputationCard';
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
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        {/* Left: New Reputation Card */}
                        <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                            <ReputationCard seller={seller} />
                        </div>

                        {/* Right: Actions & Stats */}
                        <div className="flex-1 flex flex-col items-center lg:items-end gap-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleFollow}
                                    className={`px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl ${isFollowing
                                        ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                                        : 'bg-primary-vibrant text-white shadow-primary-vibrant/20 hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    {isFollowing ? 'Siguiendo Socio' : 'Seguir a este Socio'}
                                </button>
                                <button className="size-14 bg-white/10 text-white rounded-[24px] flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all shadow-xl">
                                    <span className="material-symbols-outlined text-xl">share</span>
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-6 bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white/10">
                                <div className="flex flex-col items-center px-6">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Ubicación</span>
                                    <div className="flex items-center gap-2 text-white">
                                        <span className="material-symbols-outlined text-sm text-primary-vibrant">location_on</span>
                                        <span className="text-xs font-black uppercase tracking-tight">
                                            {seller.location?.city}, {seller.location?.state}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/10 hidden md:block" />
                                <div className="flex flex-col items-center px-6">
                                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Biografía</span>
                                    <p className="text-xs font-bold text-gray-400 max-w-xs text-center lg:text-right line-clamp-1 italic">
                                        "{seller.bio || 'Socio estelar de Vendelo Ya.'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PRODUCT GRID SECTION */}
            <main className="max-w-7xl mx-auto px-6 py-20">
                <div className="flex items-end justify-between mb-12 border-b border-light-200 pb-8">
                    <div>
                        <h2 className="text-2xl font-black text-dark-800 tracking-tight flex items-center gap-4">
                            Catálogo Premium
                            <span className="bg-primary-50 text-primary-vibrant text-[9px] px-3 py-1 rounded-full border border-primary-100 uppercase font-black tracking-widest">
                                {products.length} ACTIVOS
                            </span>
                        </h2>
                        <p className="text-sm font-bold text-gray-400 mt-2 uppercase tracking-widest">Todos los ítems verificados con protección Pago Protegido</p>
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
                        { title: 'Pago Protegido Force', icon: 'lock', text: 'Transacciones 100% protegidas mediante contratos inteligentes.' },
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
