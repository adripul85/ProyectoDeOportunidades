import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useNotification } from '../../context/NotificationContext';

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
    const { user } = useAuth(); // Assuming useAuth is available/imported
    const { notify } = useNotification(); // Assuming useNotification is available/imported
    const [isFollowing, setIsFollowing] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const isVerified = seller.verificationBadges?.identityVerified;

    React.useEffect(() => {
        if (user && seller.uid) {
            import('../../lib/users').then(({ isFollowingUser }) => {
                isFollowingUser(user.uid, seller.uid).then(setIsFollowing);
            });
        }
    }, [user, seller.uid]);

    const handleFollow = async () => {
        if (!user) {
            notify({ type: 'error', title: 'Acceso Denegado', message: 'Inicia sesión para seguir a este vendedor.', icon: 'lock' });
            return;
        }
        if (user.uid === seller.uid) return;

        setLoading(true);
        try {
            const { followUser, unfollowUser } = await import('../../lib/users');
            if (isFollowing) {
                await unfollowUser(user.uid, seller.uid);
                setIsFollowing(false);
                notify({ type: 'success', title: 'Dejado de seguir', message: `Ya no sigues a ${seller.displayName}`, icon: 'person_remove' });
            } else {
                await followUser(user.uid, seller.uid);
                setIsFollowing(true);
                notify({ type: 'success', title: 'Siguiendo', message: `Ahora sigues a ${seller.displayName}`, icon: 'person_add' });
            }
        } catch (error) {
            console.error(error);
            notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar el seguimiento.', icon: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-10 rounded-[40px] shadow-premium border border-light-200/50 relative overflow-hidden">
            {/* Header Badge */}
            {isVerified && (
                <div className="absolute top-0 right-0 py-2 px-6 bg-primary-vibrant text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-bl-3xl border-l border-b border-primary-vibrant/10 shadow-lg animate-in slide-in-from-top duration-700">
                    Vendedor Verificado ✅
                </div>
            )}

            <div className="flex justify-between items-center mb-8 ml-1">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Inteligencia del Comerciante</h3>
                {user && user.uid !== seller.uid && (
                    <button
                        onClick={handleFollow}
                        disabled={loading}
                        className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${isFollowing
                            ? 'bg-light-100 text-dark-800 hover:bg-red-50 hover:text-red-500'
                            : 'bg-dark-800 text-white hover:bg-dark-700 shadow-lg shadow-dark-800/20'
                            }`}
                    >
                        {loading ? '...' : isFollowing ? 'Dejar de Seguir' : 'Seguir'}
                    </button>
                )}
            </div>

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
                        <span className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest">Confianza Nivel {(seller.reputation?.averageRating || 0) > 4 ? 'Alto' : 'Medio'}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 bg-light-50/50 p-6 rounded-3xl border border-light-100/50 shadow-inner">
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <span key={i} className={`material-symbols-outlined text-base drop-shadow-sm ${i <= Math.round(seller.reputation?.averageRating || 0) ? 'text-amber-400 fill-1' : 'text-gray-200'}`}>star</span>
                        ))}
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">{seller.reputation?.totalReviews || 0} Protocolos Registrados</span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Link to={`/shop/${seller.uid}`} className="flex-1 sm:flex-none text-center bg-primary-vibrant text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-vibrant/20 hover:scale-105 active:scale-95 transition-all">
                        Ver Tienda
                    </Link>
                    <Link to={`/profile/${seller.uid}`} className="flex-1 sm:flex-none text-center bg-white px-6 py-3 rounded-xl text-dark-800 text-[9px] font-black uppercase tracking-[0.2em] border border-light-200 hover:bg-light-50 transition-all shadow-sm">
                        Registros
                    </Link>
                </div>
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
