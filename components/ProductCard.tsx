import React from 'react';
import { Link } from 'react-router-dom';
import { ItemData } from '../lib/items';

interface ProductCardProps {
    product: ItemData & { id: string };
    location?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, location }) => {
    return (
        <Link
            to={`/product/${product.id}`}
            className="group bg-white rounded-3xl border border-light-200 overflow-hidden hover:shadow-premium transition-all"
        >
            <div className="aspect-square bg-light-100 relative overflow-hidden">
                <img
                    src={product.images?.[0] || 'https://picsum.photos/400/400?tech'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <button
                    className="absolute top-4 right-4 size-10 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-dark-800 hover:text-primary-vibrant transition-colors shadow-sm"
                    onClick={(e) => {
                        e.preventDefault();
                        // Handle favorite logic if needed
                    }}
                >
                    <span className="material-symbols-outlined text-xl">favorite</span>
                </button>
            </div>
            <div className="p-5">
                <p className="text-xl font-black text-dark-800 mb-1">${product.price.toLocaleString()}</p>
                <h3 className="text-sm font-bold text-dark-700 line-clamp-1 mb-1">{product.title}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {location || 'Comercio Global'}
                </p>
                <div className="flex items-center justify-between mt-4">
                    <span className="text-[9px] font-black text-primary-vibrant uppercase tracking-tighter bg-primary-50 px-2 py-1 rounded-md border border-primary-100">
                        {product.category || 'Activo'}
                    </span>
                    <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                        Recién
                    </span>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
