import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getItems, ItemData, ItemCondition, getFeaturedItems, getSmartSuggestions } from '../../lib/items';
import { CATEGORIES } from '../../lib/constants';
import { LOCATION_DATA } from '../../lib/locations';
import HomeHero from '../../components/HomeHero';

const SmartSuggestionsSection = () => {
  const [suggested, setSuggested] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchSuggested = async () => {
      const items = await getSmartSuggestions(user.uid, 4);
      setSuggested(items);
      setLoading(false);
    };
    fetchSuggested();
  }, [user]);

  if (loading || suggested.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-16"
    >
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="h-5 w-1 bg-primary-vibrant rounded-full"></div>
        <h2 className="text-xl font-black text-dark-800 tracking-tight">Sugerido para ti</h2>
        <span className="bg-primary-50 text-primary-vibrant text-[8px] px-2.5 py-1 rounded-full uppercase font-black tracking-widest border border-primary-100/50">Smart Match</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {suggested.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4 }}
            className="group cursor-pointer bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-premium transition-all"
            onClick={() => window.location.href = `/product/${item.id}`}
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-50 mb-2.5">
              <img src={item.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
              <div className="absolute inset-x-2 bottom-2">
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[7px] font-black uppercase text-slate-800 border border-slate-100 shadow-sm block truncate w-full">
                  {item.subcategory || item.category}
                </span>
              </div>
            </div>
            <p className="text-sm font-black text-slate-900 mb-0.5 tracking-tight">${item.price.toLocaleString()}</p>
            <h3 className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-tight">{item.title}</h3>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
const FilterChipsBar = ({ activeCategory, activeSubcategory, priceRange, activeCondition, onOpenDrawer }: {
  activeCategory: string | null,
  activeSubcategory: string,
  priceRange: { min: string, max: string },
  activeCondition: string,
  onOpenDrawer: () => void
}) => {
  const hasActiveFilters = activeCategory || activeSubcategory || priceRange.min || priceRange.max || activeCondition;

  return (
    <div className="lg:hidden sticky top-[72px] z-30 bg-light-50/80 backdrop-blur-md -mx-6 px-6 py-3 border-b border-light-200">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={onOpenDrawer}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border shadow-sm ${hasActiveFilters ? 'bg-primary-vibrant text-white border-primary-vibrant' : 'bg-white text-dark-800 border-light-200'}`}
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          Filtros {hasActiveFilters && <span className="size-2 bg-white rounded-full animate-pulse"></span>}
        </button>

        {activeCategory && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-primary-100 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-vibrant shrink-0 shadow-sm animate-in fade-in zoom-in duration-300">
            {activeCategory}
          </div>
        )}

        {activeSubcategory && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-primary-100 rounded-full text-[10px] font-black uppercase tracking-widest text-primary-vibrant shrink-0 shadow-sm animate-in fade-in zoom-in duration-300">
            {activeSubcategory}
          </div>
        )}

        {(priceRange.min || priceRange.max) && (
          <div className="flex items-center gap-1.5 px-4 py-2 bg-white border border-emerald-100 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-600 shrink-0 shadow-sm">
            ${priceRange.min || '0'} - ${priceRange.max || '+'}
          </div>
        )}
      </div>
    </div>
  );
};

const MobileFilterDrawer = ({
  isOpen,
  onClose,
  activeCategory,
  setActiveCategory,
  activeSubcategory,
  setActiveSubcategory,
  priceRange,
  setPriceRange,
  activeCondition,
  setActiveCondition,
  activeProvince,
  setActiveProvince,
  activeCity,
  setActiveCity,
  onClear
}: any) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-dark-900/60 backdrop-blur-sm z-[100] lg:hidden"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-10 bg-white rounded-t-[40px] z-[101] lg:hidden flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-light-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="size-10 rounded-2xl bg-light-50 flex items-center justify-center text-dark-800">
                  <span className="material-symbols-outlined">close</span>
                </button>
                <h2 className="text-xl font-black text-dark-800 tracking-tighter uppercase leading-none mt-1">Refinar Nodo</h2>
              </div>
              <button
                onClick={onClear}
                className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest"
              >
                Limpiar Todo
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
              {/* Categoría & Subcategoría */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">category</span>
                  Categoría
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.name === activeCategory ? null : cat.name);
                        setActiveSubcategory('');
                      }}
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border-2 transition-all ${activeCategory === cat.name ? 'border-primary-vibrant bg-primary-50/30 ring-4 ring-primary-50/50' : 'border-light-100 bg-white hover:border-gray-200'}`}
                    >
                      <span className={`material-symbols-outlined text-2xl ${activeCategory === cat.name ? 'text-primary-vibrant' : 'text-gray-300'}`}>{cat.icon}</span>
                      <span className={`text-[9px] font-black uppercase tracking-tight text-center ${activeCategory === cat.name ? 'text-dark-800' : 'text-gray-400'}`}>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {activeCategory && CATEGORIES.find(c => c.name === activeCategory)?.sub && (
                  <div className="space-y-3 pt-4 border-t border-light-100 animate-in slide-in-from-top-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-primary-vibrant/60">Subcategoría Específica</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.find(c => c.name === activeCategory)?.sub.map(sub => (
                        <button
                          key={sub}
                          onClick={() => setActiveSubcategory(sub === activeSubcategory ? '' : sub)}
                          className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeSubcategory === sub ? 'bg-primary-vibrant text-white border-primary-vibrant shadow-md' : 'bg-white text-gray-400 border-light-100'}`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Precio */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  Rango de Precio
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">$</span>
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 pl-8 pr-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary-50/50 focus:border-primary-400"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-black">$</span>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 pl-8 pr-4 text-xs font-black outline-none focus:ring-4 focus:ring-primary-50/50 focus:border-primary-400"
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Ubicación del Activo
                </label>
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={activeProvince}
                      onChange={(e) => {
                        setActiveProvince(e.target.value);
                        setActiveCity('');
                      }}
                      className="w-full bg-light-50 border border-light-100 rounded-2xl py-4 px-5 text-xs font-black appearance-none outline-none focus:ring-4 focus:ring-primary-50/50 focus:border-primary-400"
                    >
                      <option value="">Todas las provincias</option>
                      {LOCATION_DATA.provinces.map(p => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">expand_more</span>
                  </div>

                  <div className="relative">
                    <select
                      disabled={!activeProvince}
                      value={activeCity}
                      onChange={(e) => setActiveCity(e.target.value)}
                      className="w-full bg-light-50/50 border border-light-100 rounded-2xl py-4 px-5 text-xs font-black appearance-none outline-none focus:ring-4 focus:ring-primary-50/50 focus:border-primary-400 disabled:opacity-50"
                    >
                      <option value="">Todas las ciudades</option>
                      {LOCATION_DATA.provinces.find(p => p.name === activeProvince)?.cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Integridad del Activo
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setActiveCondition(value === activeCondition ? '' : value)}
                      className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeCondition === value ? 'bg-dark-800 text-white border-dark-800' : 'bg-white text-gray-400 border-light-100'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-light-50 border-t border-light-100 sticky bottom-0 z-10">
              <button
                onClick={onClose}
                className="w-full py-5 bg-dark-800 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-premium active:scale-95 transition-all"
              >
                Aplicar Filtros
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

import SkeletonCard from '../../components/SkeletonCard';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import CountdownTimer from '../../components/product/CountdownTimer';
import TopSellersGrid from '../../components/product/TopSellersGrid';
import { triggerHaptic } from '../../lib/haptics';
import { useAuth } from '../../lib/auth';

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
  const { userProfile } = useAuth();
  const userLocation = userProfile?.location?.state || undefined;

  useEffect(() => {
    const fetchFeatured = async () => {
      const items = await getFeaturedItems(userLocation);
      setFeatured(items);
      setLoading(false);
    };
    fetchFeatured();
  }, [userLocation]);

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
          <p className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">
            Productos destacados con tiempo limitado
          </p>
        </div>
        <Link to="/deals" className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest hover:underline">Explorar Todas</Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 -mx-2 px-2 no-scrollbar scroll-smooth">
        {featured.slice(0, 6).map((product) => (
          <div key={product.id} className="w-[260px] md:w-[300px] flex-shrink-0">
            <div className="relative group h-full">
              {/* Countdown Timer Overlay */}
              {product.featuredUntil && (
                <div className="absolute top-4 right-4 z-20">
                  <div className="bg-dark-900/80 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="material-symbols-outlined text-red-400 text-xs animate-pulse">bolt</span>
                      <span className="text-[8px] font-black text-red-400 uppercase tracking-widest">Termina en</span>
                    </div>
                    <CountdownTimer targetDate={product.featuredUntil} className="text-white" />
                  </div>
                </div>
              )}
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
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [activeProvince, setActiveProvince] = useState<string>('');
  const [activeCity, setActiveCity] = useState<string>('');
  const [activeCondition, setActiveCondition] = useState<string>('');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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
    setActiveSubcategory('');
    setActiveProvince('');
    setActiveCity('');
    setActiveCondition('');
    setPriceRange({ min: '', max: '' });
  };

  const selectedProvinceData = LOCATION_DATA.provinces.find(p => p.name === activeProvince);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  return (
    <div className="flex bg-light-50 min-h-screen relative selection:bg-primary-100 selection:text-primary-900">

      {/* --- PREMIUM MESH BACKGROUND (CSS puro, sin JS) --- */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-primary-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[45vw] h-[45vw] bg-indigo-100 rounded-full blur-[80px]" />
        <div className="absolute top-[30%] left-[40%] w-[35vw] h-[35vw] bg-red-50 rounded-full blur-[100px]" />
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="hidden lg:block w-64 bg-white sticky top-20 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar z-20 shadow-sm border-r border-light-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-dark-800 mb-6 font-primary">Filtros</h2>

          <div className="space-y-8">
            {/* Categoría & Subcategoría (Accordion Desktop) */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-1">Estructura</label>
              <div className="space-y-0.5">
                {CATEGORIES.map(cat => (
                  <div key={cat.id}>
                    <button
                      onClick={() => {
                        setActiveCategory(cat.name === activeCategory ? null : cat.name);
                        setActiveSubcategory('');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all group ${activeCategory === cat.name ? 'bg-primary-50 text-primary-vibrant' : 'text-gray-500 hover:bg-light-50 hover:text-dark-800'}`}
                    >
                      <span className={`material-symbols-outlined text-lg ${activeCategory === cat.name ? 'text-primary-vibrant' : 'text-gray-300 group-hover:text-primary-vibrant/60'}`}>{cat.icon}</span>
                      <span className="flex-1 text-left line-clamp-1">{cat.name}</span>
                      <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${activeCategory === cat.name ? 'rotate-180 text-primary-vibrant' : 'text-gray-300'}`}>expand_more</span>
                    </button>

                    {/* Subcategories Dropdown */}
                    {activeCategory === cat.name && cat.sub && (
                      <div className="ml-6 pl-4 border-l-2 border-primary-100 space-y-0.5 py-1 animate-in slide-in-from-top-1 duration-200">
                        {cat.sub.map(sub => (
                          <button
                            key={sub}
                            onClick={() => setActiveSubcategory(sub === activeSubcategory ? '' : sub)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${activeSubcategory === sub ? 'text-primary-vibrant bg-primary-50/50' : 'text-gray-400 hover:text-dark-800 hover:bg-light-50'}`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
      <main className="flex-1 p-6 sm:p-12 relative z-10 pt-28 sm:pt-12">
        <div className="max-w-7xl mx-auto">

          {!activeCategory && <HomeHero />}

          {/* --- MOBILE FILTER EXPERIENCE --- */}
          <FilterChipsBar
            activeCategory={activeCategory}
            activeSubcategory={activeSubcategory}
            priceRange={priceRange}
            activeCondition={activeCondition}
            onOpenDrawer={() => setIsFilterDrawerOpen(true)}
          />

          <MobileFilterDrawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activeSubcategory={activeSubcategory}
            setActiveSubcategory={setActiveSubcategory}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            activeCondition={activeCondition}
            setActiveCondition={setActiveCondition}
            activeProvince={activeProvince}
            setActiveProvince={setActiveProvince}
            activeCity={activeCity}
            setActiveCity={setActiveCity}
            onClear={handleClearFilters}
          />


          {/* --- FLASH DEALS SECTION --- */}
          <FlashDealsSection />

          {/* --- SMART SUGGESTIONS --- */}
          <SmartSuggestionsSection />

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
              <h1 className="text-3xl sm:text-4xl font-black mb-1 flex items-center gap-4 text-dark-800 tracking-tighter uppercase">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {loading ? (
              Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : recentProducts
              .filter(p => !activeCategory || p.category === activeCategory)
              .filter(p => !activeSubcategory || p.subcategory === activeSubcategory)
              .filter(p => !priceRange.min || (p.price >= Number(priceRange.min)))
              .filter(p => !priceRange.max || (p.price <= Number(priceRange.max)))
              .filter(p => !activeCondition || p.condition === activeCondition)
              .filter(p => !activeProvince || (p.location && p.location.includes(activeProvince)))
              .filter(p => !activeCity || (p.location && p.location.includes(activeCity)))
              .length > 0 ? (
              recentProducts
                .filter(p => !activeCategory || p.category === activeCategory)
                .filter(p => !activeSubcategory || p.subcategory === activeSubcategory)
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
              whileTap={{ scale: 0.95 }}
              onClick={() => triggerHaptic('light')}
              className="group relative px-12 py-5 bg-white border border-light-200 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-dark-800 hover:text-white hover:border-dark-800 transition-colors shadow-premium"
            >
              <span className="flex items-center gap-3">
                Sincronizar Mas Datos
                <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-y-1">expand_more</span>
              </span>
            </motion.button>
          </div>

          {/* --- TOP SELLERS SECTION (Now below products) --- */}
          <div className="mt-20 border-t border-light-100 pt-20">
            <TopSellersGrid />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
