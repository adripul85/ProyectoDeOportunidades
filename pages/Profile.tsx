import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getUserProfile, UserProfile } from '../lib/users';
import { getUserTransactions } from '../lib/transactions';
import { getItemsBySeller, ItemData } from '../lib/items';
import ReviewsList from '../components/ReviewsList';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductCard from '../components/ProductCard';

const Profile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { user, userProfile: currentUserProfile } = useAuth();

  const [targetProfile, setTargetProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<(ItemData & { id: string })[]>([]);
  const [activeTab, setActiveTab] = useState<'selling' | 'reviews_seller' | 'reviews_buyer'>('selling');
  const [metrics, setMetrics] = useState({
    totalOps: 0,
    disputes: 0,
    trustScore: 0
  });

  const isOwnProfile = !uid || uid === user?.uid;

  useEffect(() => {
    async function loadProfileData() {
      setLoading(true);

      let profile: UserProfile | null = null;
      let targetUid = uid || user?.uid;

      if (!targetUid) {
        setLoading(false);
        return;
      }

      if (isOwnProfile && currentUserProfile) {
        profile = currentUserProfile;
      } else {
        profile = await getUserProfile(targetUid);
      }

      if (profile) {
        setTargetProfile(profile);
        const { compras, ventas } = await getUserTransactions(targetUid);
        const userProducts = await getItemsBySeller(targetUid);
        setProducts(userProducts);

        const totalOps = compras.length + ventas.length;
        const disputes = [...compras, ...ventas].filter(t => t.status === 'DISPUTED').length;
        const avgRating = profile.reputation?.averageRating || 0;
        const totalReviews = profile.reputation?.totalReviews || 0;
        const trustScore = totalReviews > 0 ? Math.round((avgRating / 5) * 100) : 0;
        setMetrics({ totalOps, disputes, trustScore });
      }

      setLoading(false);
    }

    loadProfileData();
  }, [uid, user, currentUserProfile]);

  if (loading) return <LoadingSpinner size="lg" text="Sincronizando Perfil de Comerciante..." />;

  if (!targetProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-50">
        <div className="text-center p-12 bg-white rounded-[40px] shadow-premium max-w-md">
          <div className="size-24 bg-light-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <span className="material-symbols-outlined text-5xl text-gray-300">person_off</span>
          </div>
          <h1 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tighter">Identidad No Encontrada</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">La identidad de protocolo solicitada no está registrada en nuestra red de comercio seguro.</p>
          <button onClick={() => navigate('/')} className="mt-10 bg-dark-800 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-dark-900 transition-all active:scale-95 shadow-xl shadow-dark-800/10">Volver al Grid</button>
        </div>
      </div>
    );
  }

  const joinDate = targetProfile.createdAt?.toDate ? targetProfile.createdAt.toDate() : new Date();
  const joinYear = joinDate.getFullYear();

  return (
    <div className="bg-light-50 min-h-screen pb-32">
      {/* --- TOP BANNER --- */}
      <div className="h-48 md:h-80 w-full relative overflow-hidden">
        <img
          src={targetProfile.coverImage || "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=2670"}
          className="w-full h-full object-cover"
          alt="Network Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 to-transparent" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 relative z-10 -mt-24 md:-mt-32">
        {/* --- HEADER PROFILE CARD --- */}
        <div className="flex flex-col md:flex-row items-end gap-8 mb-16">
          <div className="relative group">
            <div className="size-48 md:size-64 rounded-full border-[6px] border-white overflow-hidden shadow-2xl bg-white relative z-10 transition-transform group-hover:scale-[1.02] duration-500">
              <img
                src={targetProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetProfile.displayName)}&background=random`}
                className="w-full h-full object-cover"
                alt={targetProfile.displayName}
              />
            </div>
            {targetProfile.profileComplete && (
              <div className="absolute bottom-6 right-6 z-20 bg-primary-vibrant text-white size-12 rounded-full flex items-center justify-center border-4 border-white shadow-xl rotate-[-10deg] animate-in zoom-in duration-700 delay-300">
                <span className="material-symbols-outlined text-2xl font-black">verified</span>
              </div>
            )}
          </div>

          <div className="flex-1 pb-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-3">
              <h1 className="text-4xl md:text-5xl font-black text-dark-800 tracking-tighter drop-shadow-sm">
                {targetProfile.displayName}
              </h1>
              <div className="flex items-center gap-2 bg-primary-vibrant size-6 rounded-full justify-center">
                <span className="material-symbols-outlined text-white text-[14px] font-black">check</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
              <span>Vendedor Verificado</span>
              <div className="size-1.5 bg-light-200 rounded-full" />
              <span>Miembro desde {joinDate.toLocaleString('es-ES', { month: 'long' })} {joinYear}</span>
              <div className="size-1.5 bg-light-200 rounded-full" />
              <span className="text-primary-vibrant">Confiado por +500 compradores globalmente</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pb-4">
            {!isOwnProfile && (
              <>
                <button className="h-14 px-8 rounded-2xl bg-white text-dark-800 border-2 border-light-200 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-light-100 transition-all shadow-premium flex items-center gap-3 active:scale-95 group">
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">person_add</span>
                  Seguir
                </button>
                <button className="h-14 px-8 rounded-2xl bg-primary-vibrant text-white font-black text-[10px] uppercase tracking-[0.3em] hover:shadow-lg shadow-primary-vibrant/20 transition-all flex items-center gap-3 active:scale-95">
                  <span className="material-symbols-outlined text-xl">chat_bubble</span>
                  Mensaje
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* --- SIDEBAR REPUTATION --- */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-[40px] shadow-premium border border-light-200/50">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-dark-800 mb-10 pl-1">Reputación del Vendedor</h3>

              <div className="flex items-center gap-8 mb-12">
                <span className="text-6xl font-black text-dark-800 tracking-tighter">
                  {targetProfile.reputation?.averageRating.toFixed(1) || '0.0'}
                </span>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`material-symbols-outlined text-xl ${i <= Math.round(targetProfile.reputation?.averageRating || 0) ? 'text-amber-400 fill-1' : 'text-light-200'}`}>star</span>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                    {targetProfile.reputation?.totalReviews || 0} reseñas
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-12">
                {[
                  { level: 5, fill: 90 },
                  { level: 4, fill: 7 },
                  { level: 3, fill: 2 }
                ].map(rating => (
                  <div key={rating.level} className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 w-3">{rating.level}</span>
                    <div className="flex-1 h-2 bg-light-50 rounded-full overflow-hidden border border-light-100">
                      <div className="h-full bg-primary-vibrant rounded-full" style={{ width: `${rating.fill}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-gray-300 w-8 text-right">{rating.fill}%</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Vendedor Confiable', icon: 'verified', color: 'bg-primary-50 text-primary-vibrant border-primary-100' },
                  { label: 'Respuesta Rápida', icon: 'bolt', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                  { label: 'Envío Seguro', icon: 'lock', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
                ].map(badge => (
                  <div key={badge.label} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-tight ${badge.color}`}>
                    <span className="material-symbols-outlined text-base font-black">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] shadow-premium border border-light-200/50 space-y-8">
              <div className="flex items-start gap-5">
                <div className="size-12 bg-light-50 rounded-2xl flex items-center justify-center border border-light-100 shrink-0">
                  <span className="material-symbols-outlined text-primary-vibrant">location_on</span>
                </div>
                <div className="pt-1">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Ubicación</p>
                  <p className="text-sm font-black text-dark-800 uppercase tracking-tight">{targetProfile.location?.city || 'Desconocido'}, {targetProfile.location?.state || 'AR'}</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="size-12 bg-light-50 rounded-2xl flex items-center justify-center border border-light-100 shrink-0">
                  <span className="material-symbols-outlined text-primary-vibrant">schedule</span>
                </div>
                <div className="pt-1">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Tiempo de Respuesta</p>
                  <p className="text-sm font-black text-dark-800 uppercase tracking-tight">Usualmente en 1 hora</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="size-12 bg-light-50 rounded-2xl flex items-center justify-center border border-light-100 shrink-0">
                  <span className="material-symbols-outlined text-primary-vibrant">language</span>
                </div>
                <div className="pt-1">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Idiomas</p>
                  <p className="text-sm font-black text-dark-800 uppercase tracking-tight">Inglés, Español</p>
                </div>
              </div>
            </div>
          </div>

          {/* --- MAIN CONTENT AREA --- */}
          <div className="lg:col-span-8 space-y-12">
            {/* Tabs Interface */}
            <div className="flex border-b border-light-200 gap-10">
              {[
                { id: 'selling', label: `Productos en Venta (${products.length})` },
                { id: 'reviews_seller', label: `Reseñas de Vendedor (${targetProfile.reputation?.totalReviews || 0})` },
                { id: 'reviews_buyer', label: 'Reseñas de Comprador (0)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-5 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id ? 'text-primary-vibrant' : 'text-gray-400 hover:text-dark-800'}`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-vibrant rounded-t-full shadow-[0_-4px_10px_rgba(37,99,235,0.4)]" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'selling' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {products.map(p => (
                      <ProductCard key={p.id} product={p} location={targetProfile.location?.city} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-[40px] border border-light-200/50 border-dashed">
                    <div className="size-20 bg-light-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-outlined text-3xl text-gray-300">inventory_2</span>
                    </div>
                    <h3 className="text-lg font-black text-dark-800 uppercase tracking-tighter">No hay protocolos activos</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{isOwnProfile ? "Transmite tu primer activo para comenzar a operar." : "Este comerciante no tiene activos activos en la red."}</p>
                    {isOwnProfile && (
                      <button onClick={() => navigate('/publish')} className="mt-8 bg-dark-800 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dark-900 transition-all active:scale-95 shadow-lg shadow-dark-800/10">Publicar Activo</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {(activeTab === 'reviews_seller' || activeTab === 'reviews_buyer') && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-xl font-black text-dark-800 uppercase tracking-widest flex items-center gap-4 ml-2 mt-4 text-[11px]">
                  <div className="size-10 bg-dark-800 text-white rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">history_edu</span>
                  </div>
                  Sincronizar Registros de Inteligencia
                </h3>
                <ReviewsList sellerId={targetProfile.uid} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
