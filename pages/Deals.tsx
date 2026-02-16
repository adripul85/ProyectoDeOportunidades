import React, { useEffect, useState } from 'react';
import { getItems } from '../lib/items';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Deals = () => {
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeals = async () => {
            const allItems = await getItems();
            // Simulate "Deals" by picking random items or items with lower prices
            // For now, let's just take the first 8 items
            setDeals(allItems.slice(0, 8));
            setLoading(false);
        };
        fetchDeals();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen">
            <div className="mb-10 text-center">
                <span className="inline-block px-4 py-2 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-100 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    🔥 Ofertas Relámpago
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-dark-800 mb-4 tracking-tight">Oportunidades Destacadas</h1>
                <p className="text-gray-400 font-bold max-w-xl mx-auto">
                    Los mejores tratos seleccionados por nuestra red. Verificados y listos para transferir.
                </p>
            </div>

            {deals.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 font-bold">No hay ofertas disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {deals.map((product, index) => (
                        <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Deals;
