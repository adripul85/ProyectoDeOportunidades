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
    <div className="flex bg-light-50 min-h-screen">
      {/* --- SIDEBAR --- */}
      <aside className="hidden lg:block w-80 bg-white border-r border-light-200 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <h2 className="text-2xl font-black mb-6">Categorías</h2>
          <nav className="space-y-1 mb-10">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all font-bold ${cat.active ? 'bg-primary-50 text-primary-vibrant' : 'text-dark-700 hover:bg-light-100'
                  }`}
              >
                <div className={`size-10 rounded-full flex items-center justify-center ${cat.active ? 'bg-primary-vibrant text-white' : 'bg-light-100 text-dark-800'}`}>
                  <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                </div>
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-light-200 pt-8 space-y-8">
            <h3 className="text-lg font-black mb-4">Filtros</h3>

            {/* Location Filter */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ubicación</label>
              <div className="relative">
                <select
                  className="w-full bg-light-100 border-none rounded-xl py-3 px-4 font-bold text-sm appearance-none focus:ring-2 focus:ring-primary-100 pr-10"
                  onChange={(e) => setActiveLocation(e.target.value)}
                  value={activeLocation}
                >
                  <option value="">Todas las ubicaciones</option>
                  {LOCATION_DATA.provinces.map(p => (
                    <optgroup key={p.name} label={p.name}>
                      {p.cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* Radius Filter */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Radio (km)</label>
                <span className="text-xs font-bold text-primary-vibrant">{radius}</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-1.5 bg-light-200 rounded-lg appearance-none cursor-pointer accent-primary-vibrant"
              />
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Precio</label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  className="bg-light-100 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-100"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="bg-light-100 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-primary-100"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                />
              </div>
            </div>

            {/* Trust Tip */}
            <div className="bg-primary-50 rounded-2xl p-5 border border-primary-100">
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">Tips para compra segura</p>
              <p className="text-[11px] font-bold text-primary-800 leading-relaxed">
                Siempre reúnete en lugares públicos y revisa el ítem antes de pagar.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 sm:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8 sm:mb-12">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black mb-2 flex items-center gap-3">
                {activeCategory ? activeCategory : 'Destacados en Buenos Aires'}
                <span className="text-red-600">🎯</span>
              </h1>
              <p className="text-sm font-bold text-gray-400">
                {activeCategory ? `Mostrando activos en ${activeCategory}` : 'Nuevos arribos de vendedores confiables cerca tuyo.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : recentProducts
              .filter(p => !activeCategory || p.category === activeCategory)
              .filter(p => !priceRange.min || (p.price >= Number(priceRange.min)))
              .filter(p => !priceRange.max || (p.price <= Number(priceRange.max)))
              // Radius and Location filtering would typically happen on the backend or using geospatial data
              // For this demo, we can simulate location filtering if we had location data on items
              // For now, we'll just demonstrate logical connectivity
              .length > 0 ? (
              recentProducts
                .filter(p => !activeCategory || p.category === activeCategory)
                .filter(p => !priceRange.min || (p.price >= Number(priceRange.min)))
                .filter(p => !priceRange.max || (p.price <= Number(priceRange.max)))
                .map(p => (
                  <ProductCard key={p.id} product={p} location={p.location} />
                ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <div className="size-20 bg-light-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-gray-400">inventory_2</span>
                </div>
                <h3 className="text-xl font-black mb-2">No se encontraron ítems</h3>
                <p className="text-gray-500 font-bold">Prueba ajustando tus filtros o ubicación.</p>
              </div>
            )}
          </div>

          <div className="mt-16 flex justify-center">
            <button className="btn-secondary !rounded-full !py-3 !px-10 text-sm">
              Ver más
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
