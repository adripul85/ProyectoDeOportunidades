import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getItems, ItemData, CATEGORIES } from '../../lib/items';
import { LOCATION_DATA } from '../../lib/locations';
import SkeletonCard from '../../components/SkeletonCard';
import ProductCard from '../../components/ProductCard';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, string> = {
  "Vehículos": "directions_car",
  "Inmuebles": "home_work",
  "Electrónica": "dvr",
  "Celulares y Teléfonos": "smartphone",
  "Moda y Accesorios": "checkroom",
  "Hogar": "weekend",
  "Instrumentos Musicales": "piano",
  "Gratis": "redeem",
  "Computación": "laptop_mac",
  "Audio y Video": "headset",
  "Videojuegos": "sports_esports",
  "Muebles y Decoración": "chair",
  "Electrodomésticos": "kitchen",
  "Joyas y Relojes": "watch",
  "Belleza y Salud": "content_cut",
  "Deportes y Fitness": "fitness_center",
  "Accesorios Vehículos": "minor_crash",
  "Construcción": "home_repair_service",
  "Bebés": "child_care",
  "Oficina y Papelería": "content_paste",
  "Alimentos y Bebidas": "fastfood",
  "Juegos y Juguetes": "toys",
  "Mascotas": "pets",
  "Cámaras y Accesorios": "photo_camera",
  "Servicios": "handshake",
  "Otras categorías": "category"
};

const Home = () => {
  const navigate = useNavigate();
  const [recentProducts, setRecentProducts] = useState<(ItemData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [radius, setRadius] = useState(20);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<string>('');
  const [activeProvince, setActiveProvince] = useState<string>('');

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

  const categories = CATEGORIES.map(cat => ({
    name: cat,
    icon: CATEGORY_ICONS[cat] || 'category',
    active: activeCategory === cat
  }));

  return (
    <div className="flex bg-light-50 min-h-screen relative overflow-hidden">

      {/* --- AMBIENT BACKGROUND GLOW --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[0%] left-[0%] w-[40%] h-[40%] bg-red-50 rounded-full blur-[100px]"></div>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className="hidden lg:block w-80 bg-white/50 backdrop-blur-xl border-r border-white/50 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar z-20">
        <div className="p-6">
          <h2 className="text-2xl font-black mb-6 text-dark-800 tracking-tight">Explorar</h2>
          <nav className="space-y-1 mb-10">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all font-bold group ${cat.active ? 'bg-dark-800 text-white shadow-lg' : 'text-gray-500 hover:bg-white hover:shadow-sm'
                  }`}
              >
                <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${cat.active ? 'bg-white/20 text-white' : 'bg-light-100 text-dark-400 group-hover:text-dark-800'}`}>
                  <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                </div>
                <span className="text-sm tracking-wide">{cat.name}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-light-200/50 pt-8 space-y-8">
            <h3 className="text-lg font-black mb-4 tracking-tight">Filtros</h3>

            {/* Location Filter */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ubicación</label>
              <div className="relative group">
                <select
                  className="w-full bg-white border border-light-200 rounded-2xl py-3.5 px-4 font-bold text-sm appearance-none focus:ring-2 focus:ring-dark-800/10 outline-none pr-10 transition-all shadow-sm hover:border-dark-800/20"
                  onChange={(e) => setActiveLocation(e.target.value)}
                  value={activeLocation}
                >
                  <option value="">Global / Todas</option>
                  {LOCATION_DATA.provinces.map(p => (
                    <optgroup key={p.name} label={p.name}>
                      {p.cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-dark-800 transition-colors">location_on</span>
              </div>
            </div>

            {/* Radius Filter */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Radio de Búsqueda</label>
                <span className="px-2 py-1 bg-dark-800 text-white text-[10px] font-black rounded-lg">{radius} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-1.5 bg-light-200 rounded-lg appearance-none cursor-pointer accent-dark-800"
              />
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Rango de Precio</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full bg-white border border-light-200 rounded-xl py-3 pl-6 pr-3 text-sm font-bold focus:ring-2 focus:ring-dark-800/10 outline-none"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full bg-white border border-light-200 rounded-xl py-3 pl-6 pr-3 text-sm font-bold focus:ring-2 focus:ring-dark-800/10 outline-none"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Trust Tip */}
            <div className="bg-gradient-to-br from-dark-800 to-black rounded-[24px] p-6 text-white shadow-xl shadow-dark-800/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-yellow-400">verified_user</span>
                <p className="text-[10px] font-black uppercase tracking-widest">Safety First</p>
              </div>
              <p className="text-[11px] font-bold text-gray-300 leading-relaxed opacity-90">
                Utiliza siempre los Puntos de Encuentro Seguros recomendados por la app para tus transacciones físicas.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 sm:p-10 relative z-10">
        <div className="max-w-7xl mx-auto">

          {/* --- HERO BANNER --- */}
          {!activeCategory && (
            <div className="mb-10 relative rounded-[40px] overflow-hidden min-h-[220px] flex items-center p-8 sm:p-10 shadow-2xl shadow-primary-900/20 group">
              {/* Hero Background */}
              <div className="absolute inset-0 bg-dark-900">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary-600 to-indigo-600 rounded-full blur-[150px] opacity-60 mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-red-600 to-orange-600 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse-slow delay-700"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100"></div>
              </div>

              {/* Hero Content */}
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 mb-4 border border-white/20">
                  <span className="size-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Red de Comercio Segura Activa</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white leading-[0.9] tracking-tighter mb-4">
                  El Nuevo Estándar de <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Confianza Digital.</span>
                </h1>
                <p className="text-sm md:text-base font-bold text-gray-300 mb-6 max-w-lg leading-relaxed">
                  Compra y vende activos premium con la seguridad del sistema Escrow integrado. Tu dinero, protegido hasta la entrega.
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white text-dark-900 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-transform active:scale-95 shadow-xl">
                    Explorar Mercado
                  </button>
                  <button
                    onClick={() => navigate('/escrow-info')}
                    className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-md"
                  >
                    Cómo Funciona
                  </button>
                </div>
              </div>

              {/* 3D Abstract Element (CSS Only) */}
              <div className="absolute right-[-80px] top-1/2 -translate-y-1/2 hidden xl:block pointer-events-none opacity-80">
                <div className="relative size-[400px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-full border border-white/10 backdrop-blur-sm animate-[spin_20s_linear_infinite]"></div>
                  <div className="absolute inset-[40px] bg-gradient-to-tl from-white/5 to-transparent rounded-full border border-white/5 backdrop-blur-md animate-[spin_15s_linear_infinite_reverse]"></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-3 text-dark-800 tracking-tight">
                {activeCategory ? activeCategory : 'Tendencias del Mercado'}
                {activeCategory && <span className="text-primary-vibrant material-symbols-outlined text-3xl">category</span>}
              </h1>
              <p className="text-sm font-bold text-gray-400">
                {activeCategory ? `Explorando el catálogo de ${activeCategory}` : 'Nuevas oportunidades verificadas cerca tuyo.'}
              </p>
            </div>

            {/* View Toggle (List/Grid) - Mockup */}
            <div className="hidden sm:flex bg-white p-1 rounded-xl border border-light-200">
              <button className="p-2 rounded-lg bg-light-100 text-dark-800"><span className="material-symbols-outlined text-lg">grid_view</span></button>
              <button className="p-2 rounded-lg text-gray-400 hover:bg-light-50"><span className="material-symbols-outlined text-lg">view_list</span></button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {loading ? (
              Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : recentProducts
              .filter(p => !activeCategory || p.category === activeCategory)
              .filter(p => !priceRange.min || (p.price >= Number(priceRange.min)))
              .filter(p => !priceRange.max || (p.price <= Number(priceRange.max)))
              .length > 0 ? (
              recentProducts
                .filter(p => !activeCategory || p.category === activeCategory)
                .filter(p => !priceRange.min || (p.price >= Number(priceRange.min)))
                .filter(p => !priceRange.max || (p.price <= Number(priceRange.max)))
                .map(p => (
                  <ProductCard key={p.id} product={p} location={p.location} />
                ))
            ) : (
              <div className="col-span-full py-32 text-center bg-white rounded-[48px] border border-light-200 border-dashed">
                <div className="size-24 bg-light-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
                </div>
                <h3 className="text-2xl font-black mb-3 text-dark-800">No se encontraron activos</h3>
                <p className="text-gray-400 font-bold mb-8">Intenta ajustar tus filtros o explora otras categorías.</p>
                <button onClick={() => { setActiveCategory(null); setPriceRange({ min: '', max: '' }) }} className="text-primary-vibrant font-black text-xs uppercase tracking-widest hover:underline">Limpiar Filtros</button>
              </div>
            )}
          </div>

          <div className="mt-20 flex justify-center">
            <button className="group relative px-8 py-3 bg-white border border-light-200 rounded-full text-xs font-black uppercase tracking-widest hover:bg-dark-800 hover:text-white hover:border-dark-800 transition-all shadow-sm">
              <span className="flex items-center gap-2">
                Ver Todo el Catálogo
                <span className="material-symbols-outlined text-base group-hover:translate-y-0.5 transition-transform">expand_more</span>
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
