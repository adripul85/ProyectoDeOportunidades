import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getItems, ItemData, CATEGORIES_STRUCTURE, ItemCondition, getFeaturedItems } from '../../lib/items';
import { LOCATION_DATA } from '../../lib/locations';
import SkeletonCard from '../../components/SkeletonCard';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import CountdownTimer from '../../components/product/CountdownTimer';
import TopSellersGrid from '../../components/product/TopSellersGrid';

const CONDITION_LABELS: Record<ItemCondition, string> = {
  'new': 'Nuevo',
  'like_new': 'Como nuevo',
  'good': 'Buen estado',
  'used': 'Usado',
  'repair': 'Para reparar',
  'digital': 'Producto digital',
  'service': 'Servicio'
};

const FlashDealsSection = () => {
  const [featured, setFeatured] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      const items = await getFeaturedItems();
      setFeatured(items);
      setLoading(false);
    };
    fetchFeatured();
  }, []);

  if (loading || featured.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-16"
    >
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="bg-red-600 text-white px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.2em] shadow-lg shadow-red-600/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm animate-pulse">bolt</span>
            Ofertas Relámpago
          </div>
          <div className="hidden sm:flex items-center gap-3 ml-4 bg-white px-4 py-1.5 rounded-full border border-light-200">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Termina en:</span>
            <CountdownTimer targetDate={new Date(Date.now() + 48 * 60 * 60 * 1000)} />
          </div>
        </div>
        <Link to="/deals" className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest hover:underline">Ver Todo</Link>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar scroll-smooth">
        {featured.slice(0, 6).map((product) => (
          <div key={product.id} className="min-w-[280px] md:min-w-[320px]">
            <div className="relative group">
              <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md text-red-600 px-3 py-1 rounded-xl font-black text-[10px] shadow-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">trending_down</span>
                -{Math.floor(Math.random() * 15 + 15)}%
              </div>
              <ProductCard product={product} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [recentProducts, setRecentProducts] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [radius, setRadius] = useState(20);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeProvince, setActiveProvince] = useState<string>('');
  const [activeCity, setActiveCity] = useState<string>('');
  const [activeCondition, setActiveCondition] = useState<string>('');

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'De Oportunidades | El Mercado de Confianza';
    return () => { document.title = prevTitle; };
  }, []);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      const items = await getItems();
      setRecentProducts(items);
      setLoading(false);
    };
    fetchRecent();
  }, []);

  const handleClearFilters = () => {
    setActiveCategory(null);
    setActiveProvince('');
    setActiveCity('');
    setActiveCondition('');
    setPriceRange({ min: '', max: '' });
  };

  const selectedProvinceData = LOCATION_DATA.provinces.find(p => p.name === activeProvince);

  return (
    <div className="flex bg-light-50 min-h-screen relative overflow-hidden selection:bg-primary-100 selection:text-primary-900">

      {/* --- PREMIUM MESH BACKGROUND --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary-200/40 rounded-full blur-[120px] animate-mesh-1"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[45vw] h-[45vw] bg-indigo-100 rounded-full blur-[100px] animate-mesh-2"></div>
        <div className="absolute top-[30%] left-[40%] w-[35vw] h-[35vw] bg-red-50 rounded-full blur-[120px] animate-mesh-3"></div>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="hidden lg:block w-80 bg-white sticky top-20 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar z-20 shadow-sm border-r border-light-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-6 font-primary">Filtros</h2>

          <div className="space-y-8">
            {/* Categoría */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-500">Categoría</label>
              <div className="relative">
                <select
                  value={activeCategory || ''}
                  onChange={(e) => setActiveCategory(e.target.value || null)}
                  className="w-full bg-white border border-light-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary-50 focus:border-primary-400 outline-none transition-all appearance-none pr-10 text-dark-700"
                >
                  <option value="">Todas las categorías</option>
                  {Object.entries(CATEGORIES_STRUCTURE).map(([group, cats]) => (
                    <optgroup key={group} label={group} className="font-bold text-dark-800 bg-light-50">
                      {cats.map(cat => (
                        <option key={cat} value={cat} className="font-medium text-dark-600 bg-white">
                          &nbsp;&nbsp;&nbsp;{cat}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Estado */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-500">Estado</label>
              <div className="relative">
                <select
                  value={activeCondition}
                  onChange={(e) => setActiveCondition(e.target.value)}
                  className="w-full bg-white border border-light-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary-50 focus:border-primary-400 outline-none transition-all appearance-none pr-10 text-dark-700"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Precio */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-500">Precio</label>
              <div className="space-y-3">
                <div className="relative flex rounded-xl overflow-hidden border border-light-200 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50 transition-all">
                  <span className="bg-light-100 flex items-center justify-center px-4 border-r border-light-200 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full py-3 px-4 text-sm outline-none font-medium text-dark-700"
                  />
                </div>
                <div className="relative flex rounded-xl overflow-hidden border border-light-200 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-50 transition-all">
                  <span className="bg-light-100 flex items-center justify-center px-4 border-r border-light-200 text-gray-400 font-bold">$</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full py-3 px-4 text-sm outline-none font-medium text-dark-700"
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-500">Ubicación</label>
              <div className="space-y-3">
                <div className="relative">
                  <select
                    value={activeProvince}
                    onChange={(e) => {
                      setActiveProvince(e.target.value);
                      setActiveCity('');
                    }}
                    className="w-full bg-white border border-light-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary-50 focus:border-primary-400 outline-none transition-all appearance-none pr-10 text-dark-700"
                  >
                    <option value="">Todas las provincias</option>
                    {LOCATION_DATA.provinces.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>

                <div className="relative">
                  <select
                    disabled={!activeProvince}
                    value={activeCity}
                    onChange={(e) => setActiveCity(e.target.value)}
                    className="w-full bg-light-50/50 border border-light-200 rounded-xl py-3 px-4 text-sm font-medium focus:ring-4 focus:ring-primary-50 focus:border-primary-400 outline-none transition-all appearance-none pr-10 text-dark-700 disabled:opacity-50"
                  >
                    <option value="">Todas las ciudades</option>
                    {selectedProvinceData?.cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            {/* Borrar Filtros */}
            <div className="pt-4">
              <button
                onClick={handleClearFilters}
                className="w-full py-4 rounded-full border-2 border-[#FF7043] text-[#FF7043] font-bold text-sm tracking-tight hover:bg-[#FF7043] hover:text-white transition-all active:scale-95"
              >
                Borrar filtros
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 sm:p-12 relative z-10 h-screen overflow-y-auto custom-scrollbar pt-28 sm:pt-12">
        <div className="max-w-7xl mx-auto">

          {/* --- HERO BANNER --- */}
          <AnimatePresence mode="wait">
            {!activeCategory && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-10 relative rounded-[32px] overflow-hidden min-h-[240px] flex items-center p-8 sm:p-12 shadow-xl shadow-primary-900/10 group"
              >
                {/* Hero Background */}
                <div className="absolute inset-0 bg-dark-900">
                  <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-600 to-indigo-600 rounded-full blur-[150px] opacity-60 mix-blend-screen animate-mesh-1"></div>
                  <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-red-600 to-orange-600 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-mesh-2"></div>
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 max-w-2xl">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 mb-6 border border-white/20"
                  >
                    <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></span>
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Protocolo de Confianza v2.0 Activo</span>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl md:text-5xl font-black text-white leading-[1.1] tracking-tighter mb-6"
                  >
                    El Nuevo Estándar de <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">Excelencia Digital.</span>
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm md:text-base font-bold text-gray-300/80 mb-8 max-w-lg leading-relaxed antialiased"
                  >
                    Transacciona activos verificados con la máxima seguridad del sistema de resguardo integrado. Tu tranquilidad es nuestro activo más valioso.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-wrap gap-5"
                  >
                    <button className="px-10 py-4 bg-white text-dark-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-primary-50 transition-all hover:scale-105 active:scale-95 shadow-2xl">
                      Acceder al Catálogo
                    </button>
                    <button
                      onClick={() => navigate('/escrow-info')}
                      className="px-8 py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-xl active:scale-95"
                    >
                      Auditores de Seguridad
                    </button>
                  </motion.div>
                </div>

                {/* Abstract 3D Element */}
                <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none opacity-40">
                  <div className="relative size-[350px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full border border-white/10 backdrop-blur-sm animate-spin-extremely-slow"></div>
                    <div className="absolute inset-[40px] bg-gradient-to-tl from-white/5 to-transparent rounded-full border border-white/5 backdrop-blur-md animate-spin-extremely-slow" style={{ animationDirection: 'reverse' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* --- FLASH DEALS SECTION --- */}
          <FlashDealsSection />

          {/* --- TOP SELLERS SECTION --- */}
          <TopSellersGrid />

          {/* --- SECTION HEADER --- */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="size-2 bg-primary-vibrant rounded-full animate-pulse shadow-[0_0_10px_rgba(230,30,30,0.5)]"></div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-vibrant">Exploración de Nodo</h2>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mb-2 flex items-center gap-4 text-dark-800 tracking-tighter uppercase">
                {activeCategory ? activeCategory : 'Oportunidades Globales'}
              </h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest opacity-60">
                {activeCategory ? `Filtrando activos por categoría: ${activeCategory}` : 'Nuevas verificaciones sincronizadas en tiempo real.'}
              </p>
            </motion.div>

            {/* View Toggle */}
            <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/50 shadow-premium">
              <button className="px-4 py-2 rounded-xl bg-dark-800 text-white shadow-lg"><span className="material-symbols-outlined text-lg">grid_view</span></button>
              <button className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/40 hover:text-dark-800 transition-all"><span className="material-symbols-outlined text-lg">view_list</span></button>
            </div>
          </div>

          {/* --- PRODUCT GRID --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {loading ? (
              Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : recentProducts
              .filter(p => !activeCategory || p.category === activeCategory)
              .filter(p => !priceRange.min || (p.price >= Number(priceRange.min)))
              .filter(p => !priceRange.max || (p.price <= Number(priceRange.max)))
              .filter(p => !activeCondition || p.condition === activeCondition)
              .filter(p => !activeProvince || (p.location && p.location.includes(activeProvince)))
              .filter(p => !activeCity || (p.location && p.location.includes(activeCity)))
              .length > 0 ? (
              recentProducts
                .filter(p => !activeCategory || p.category === activeCategory)
                .filter(p => !priceRange.min || (p.price >= Number(priceRange.min)))
                .filter(p => !priceRange.max || (p.price <= Number(priceRange.max)))
                .filter(p => !activeCondition || p.condition === activeCondition)
                .filter(p => !activeProvince || (p.location && p.location.includes(activeProvince)))
                .filter(p => !activeCity || (p.location && p.location.includes(activeCity)))
                .map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: (idx % 4) * 0.1 }}
                  >
                    <ProductCard product={p} location={p.location} />
                  </motion.div>
                ))
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="col-span-full py-40 text-center bg-white/40 backdrop-blur-2xl rounded-[60px] border border-white/50 border-dashed shadow-premium"
              >
                <div className="size-28 bg-light-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <span className="material-symbols-outlined text-5xl text-gray-200 animate-float">search_off</span>
                </div>
                <h3 className="text-3xl font-black mb-4 text-dark-800 tracking-tighter uppercase">Protocolo No Hallado</h3>
                <p className="text-gray-400 font-bold mb-10 text-xs uppercase tracking-widest max-w-sm mx-auto opacity-70">No se han detectado activos con los parámetros especificados en este sector.</p>
                <button onClick={() => { setActiveCategory(null); setPriceRange({ min: '', max: '' }) }} className="btn-primary flex-none mx-auto scale-90">Reiniciar Filtros de Nodo</button>
              </motion.div>
            )}
          </div>

          <div className="mt-28 flex justify-center pb-20">
            <motion.button
              whileHover={{ y: 5 }}
              className="group relative px-12 py-5 bg-white border border-light-200 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-dark-800 hover:text-white hover:border-dark-800 transition-all shadow-premium active:scale-95"
            >
              <span className="flex items-center gap-3">
                Sincronizar Mas Datos
                <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-y-1">expand_more</span>
              </span>
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
