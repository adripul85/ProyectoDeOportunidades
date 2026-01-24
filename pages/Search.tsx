
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState('');
  
  // Lógica de extracción robusta para HashRouter
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

  // Datos mock para los resultados
  const allProducts = [
    { id: 1, title: "Monitor Gamer Curvo 27' 165Hz", price: "$85.000", category: "Computación", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400" },
    { id: 2, title: "iPhone 13 Pro Max - 128GB", price: "$450.000", category: "Celulares", img: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=400" },
    { id: 3, title: "Teclado Mecánico RGB", price: "$32.000", category: "Computación", img: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&q=80&w=400" },
    { id: 4, title: "Silla Gamer Ergonómica", price: "$120.000", category: "Muebles", img: "https://images.unsplash.com/photo-1598550476439-6847785fce66?auto=format&fit=crop&q=80&w=400" },
    { id: 5, title: "Auriculares Inalámbricos Sony", price: "$95.000", category: "Audio", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400" },
    { id: 6, title: "MacBook Air M2 2023", price: "$1.200.000", category: "Computación", img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400" }
  ];

  const results = useMemo(() => {
    if (!query) return allProducts;
    const cleanQuery = query.toLowerCase();
    return allProducts.filter(p => 
      p.title.toLowerCase().includes(cleanQuery) || 
      p.category.toLowerCase().includes(cleanQuery)
    );
  }, [query]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
      setLocalSearch('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-[60vh]">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center justify-center size-10 rounded-full border-2 border-dark-charcoal/10 hover:bg-menta hover:border-menta transition-all"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <h1 className="text-3xl font-display font-black text-dark-charcoal">
              {query ? `Buscando "${query}"` : 'Explora todos los tesoros'}
            </h1>
          </div>
          <p className="text-gray-500 font-bold ml-14">
            Hemos encontrado {results.length} oportunidades increíbles para ti.
          </p>
        </div>

        <form onSubmit={handleManualSearch} className="relative w-full max-w-sm group">
          <input 
            type="text" 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Nueva búsqueda..." 
            className="w-full py-3.5 pl-6 pr-12 bg-white hand-drawn-card font-handwritten text-lg focus:ring-4 focus:ring-menta/20 outline-none transition-all"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-menta-dark transition-colors">
            <span className="material-symbols-outlined">search</span>
          </button>
        </form>
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {results.map((product) => (
            <div 
              key={product.id} 
              className="group cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="bg-white hand-drawn-card p-4 transition-all hover:-translate-y-2 hover:rotate-1 hover:shadow-2xl border-2 border-dark-charcoal">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                  <img 
                    src={product.img} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                  />
                </div>
                <span className="inline-block bg-sky-soft px-3 py-1 rounded-full text-[10px] font-black uppercase text-blue-700 mb-2 tracking-widest border border-blue-200">
                  {product.category}
                </span>
                <h3 className="font-display font-bold text-xl text-dark-charcoal mb-2 line-clamp-2 h-14 leading-tight">
                  {product.title}
                </h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-black text-berry">{product.price}</span>
                  <div className="size-10 rounded-full hand-drawn-border flex items-center justify-center text-dark-charcoal/30 group-hover:text-menta-dark group-hover:bg-menta/10 transition-colors border-2">
                    <span className="material-symbols-outlined font-bold">handshake</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white hand-drawn-card p-16 text-center rotate-[-1deg] max-w-2xl mx-auto mt-20 border-4 border-dashed border-dark-charcoal/10">
          <div className="size-24 bg-coral-soft/20 rounded-full flex items-center justify-center mx-auto mb-6 hand-drawn-border rotate-12">
            <span className="material-symbols-outlined text-5xl text-coral-soft">search_off</span>
          </div>
          <h2 className="text-3xl font-display font-black mb-4">¡Vaya! El tesoro se esconde</h2>
          <p className="font-handwritten text-xl text-gray-500 mb-8 leading-relaxed">
            No encontramos nada para "{query}". <br/>
            ¿Probamos con otra palabra mágica?
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-menta text-dark-charcoal font-black rounded-full hand-drawn-card shadow-[4px_4px_0px_rgba(16,34,24,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Volver a la base
          </button>
        </div>
      )}

      {results.length < 3 && (
        <div className="mt-20 pt-20 border-t-4 border-dashed border-gray-100">
          <h2 className="text-2xl font-display font-black mb-8">También te podría interesar...</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {allProducts.slice(0, 4).map(p => (
              <div key={p.id} className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer group" onClick={() => navigate(`/product/${p.id}`)}>
                <div className="bg-white hand-drawn-card p-3 scale-95 group-hover:scale-100 transition-transform border-2 border-dark-charcoal">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2">
                    <img src={p.img} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-black truncate font-display">{p.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
