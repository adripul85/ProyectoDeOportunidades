import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getItems, ItemData, CATEGORIES } from '../../lib/items';
import SkeletonCard from '../../components/SkeletonCard';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  const [allProducts, setAllProducts] = useState<(ItemData & { id: string, img: string, trust: number })[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const items = await getItems();
      const mappedItems = items.map(item => ({
        ...item,
        img: item.images?.[0] || 'https://picsum.photos/400/400?tech',
        trust: 9.5 + (Math.random() * 0.4) // Mock trust for now
      }));
      setAllProducts(mappedItems);
      setLoading(false);
    };
    fetchItems();
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams(location.search);
    let q = params.get('q');
    if (!q && location.hash.includes('?')) {
      const parts = location.hash.split('?');
      if (parts[1]) {
        const hashParams = new URLSearchParams(parts[1]);
        q = hashParams.get('q');
      }
    }
    return q || '';
  }, [location.search, location.hash]);

  const results = useMemo(() => {
    let filtered = allProducts;

    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedConditions.length > 0) {
      const mappedConditions: Record<string, string> = {
        'Nuevo': 'new',
        'Como Nuevo': 'like_new',
        'Usado': 'good', // Mapping roughly for now
        'Desgastado': 'fair'
      };
      filtered = filtered.filter(p => {
        const readableCondition = Object.keys(mappedConditions).find(key => mappedConditions[key] === p.condition);
        return selectedConditions.includes(readableCondition || p.condition);
      });
    }

    return filtered;
  }, [query, priceRange, selectedConditions, allProducts]);

  const toggleCondition = (c: string) => {
    setSelectedConditions(prev => prev.includes(c) ? prev.filter(item => item !== c) : [...prev, c]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen bg-gray-50/30">
      {/* Header & Search Bar */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white p-8 rounded-[2.5rem] border border-border-light shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="size-12 rounded-2xl bg-gray-50 border border-border-light flex items-center justify-center hover:bg-gray-100 transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Explorador de Activos</p>
            <h1 className="text-2xl font-black text-dark-charcoal">{query ? `Resultados: ${query}` : 'Catálogo Institucional'}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={(e) => { e.preventDefault(); if (localSearch) navigate(`/search?q=${localSearch}`); }} className="relative flex-1 md:w-80 group">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filtro rápido..."
              className="w-full py-4 pl-6 pr-14 bg-gray-50 border border-border-light rounded-2xl font-bold text-sm focus:bg-white focus:border-dark-charcoal/20 outline-none transition-all"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-dark-charcoal">
              <span className="material-symbols-outlined">search</span>
            </button>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden size-14 rounded-2xl flex items-center justify-center border transition-all ${showFilters ? 'bg-dark-charcoal text-white border-dark-charcoal' : 'bg-white text-dark-charcoal border-border-light shadow-sm'}`}
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Filters Sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-3 space-y-10 animate-in fade-in duration-500`}>
          <div className="bg-white p-8 rounded-[2rem] border border-border-light shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 pb-4 border-b border-gray-50 flex items-center justify-between">
              Configuración de Filtros
              <span className="material-symbols-outlined text-sm">filter_alt</span>
            </h3>

            {/* Price Filter */}
            <div className="mb-10">
              <p className="text-xs font-black text-dark-charcoal uppercase tracking-tighter mb-6">Rango de Valor (ARS)</p>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="2000000"
                  step="10000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-dark-charcoal"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-400">Desde $0</span>
                  <span className="text-[10px] font-black text-dark-charcoal bg-gray-50 px-2 py-1 rounded">Hasta ${priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Condition Filter */}
            <div className="mb-10">
              <p className="text-xs font-black text-dark-charcoal uppercase tracking-tighter mb-6">Estado del Producto</p>
              <div className="space-y-3">
                {['Nuevo', 'Como Nuevo', 'Usado'].map(c => (
                  <label key={c} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={selectedConditions.includes(c)}
                      onChange={() => toggleCondition(c)}
                    />
                    <div className={`size-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedConditions.includes(c) ? 'bg-dark-charcoal border-dark-charcoal' : 'border-gray-100 group-hover:border-gray-200'}`}>
                      {selectedConditions.includes(c) && <span className="material-symbols-outlined text-white text-xs font-black">check</span>}
                    </div>
                    <span className={`text-[11px] font-bold transition-colors ${selectedConditions.includes(c) ? 'text-dark-charcoal' : 'text-gray-400'}`}>{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="mb-10">
              <p className="text-xs font-black text-dark-charcoal uppercase tracking-tighter mb-6">Categoría</p>
              <select
                className="w-full p-3 bg-light-50 border border-border-light rounded-lg text-xs font-bold text-dark-charcoal outline-none focus:border-dark-charcoal/20"
                onChange={(e) => navigate(`/search?q=${e.target.value}`)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Institutional Meta */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="flex items-center gap-2 text-emerald-600 mb-3">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <p className="text-[9px] font-black uppercase tracking-widest leading-none">Protección Activa</p>
              </div>
              <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic">Todos los resultados mostrados se encuentran bajo el ala de custodia Escrow de la plataforma.</p>
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <div className="lg:col-span-9 space-y-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{results.length} activos localizados</p>
            <select className="bg-transparent text-[10px] font-black uppercase tracking-widest text-dark-charcoal outline-none cursor-pointer">
              <option>Relevancia Institucional</option>
              <option>Menor Precio</option>
              <option>Mayor Confianza</option>
            </select>
          </div>

          {loading ? (
            // Show skeleton cards while loading
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {results.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="group bg-white rounded-[2rem] border border-border-light overflow-hidden hover:shadow-trust-lg transition-all cursor-pointer flex flex-col animate-in fade-in duration-500"
                >
                  <div className="aspect-[5/4] bg-gray-100 relative overflow-hidden">
                    <img src={p.img} alt={p.title} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" />
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-dark-charcoal shadow-sm border border-white/20">
                        {p.category}
                      </span>
                      <span className="bg-dark-charcoal/80 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                        {p.condition}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4 bg-emerald-500 text-white size-10 rounded-xl flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="font-bold text-dark-charcoal mb-2 leading-tight line-clamp-2 h-10 group-hover:text-emerald-500 transition-colors uppercase tracking-tight text-sm">
                      {p.title}
                    </h3>
                    <div className="mt-auto pt-6 border-t border-gray-50 flex items-end justify-between">
                      <div>
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Valor Asegurado</p>
                        <p className="text-2xl font-black text-dark-charcoal leading-none">${p.price.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-1 uppercase">
                          Trust {p.trust}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white py-32 text-center rounded-[3rem] border border-border-light shadow-sm">
              <div className="size-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <span className="material-symbols-outlined text-4xl text-gray-200">database_off</span>
              </div>
              <h2 className="text-xl font-black text-dark-charcoal mb-4 uppercase tracking-widest">Sin coincidencias</h2>
              <p className="text-sm text-gray-400 max-w-xs mx-auto font-medium">No se han localizado activos bajo los parámetros de filtrado seleccionados.</p>
              <button
                onClick={() => { setPriceRange([0, 2000000]); setSelectedConditions([]); }}
                className="mt-10 btn-secondary"
              >
                Resetear Filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
