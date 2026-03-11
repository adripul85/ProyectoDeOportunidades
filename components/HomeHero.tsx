import React from 'react';
import { Link } from 'react-router-dom';
import { ItemData } from '../lib/items';
import { CATEGORIES } from '../lib/constants';

const CATEGORY_IMAGE_MAP: Record<string, string> = {
    'Tecnología': '1460925895917-afdab827c52f',
    'Hogar y Muebles': '1586023434215-84af6eb08b56',
    'Electrodomésticos': '1556910103-1c02745aae4d',
    'Herramientas': '1581092115919-093a8d467727',
    'Construcción': '1503387762-592deb58ef4e',
    'Moda': '1483985988355-763728e1935b',
    'Deportes y Fitness': '1517836357463-d25dfeac3438',
    'Vehículos': '1533473359331-013f956ce11c',
    'Accesorios Vehículos': '1592853625511-df73cfcb4006',
    'Bebés': '1519689680058-324335c77eba',
    'Belleza y Cuidado': '1596462502278-27bf850333ce',
    'Juegos y Juguetes': '1566576912321-7053e1eb4d3f',
    'Alimentos y Bebidas': '1542838132-92c53300491e',
    'default': '1472851294608-062e24dadaea' // generic shop
};

interface HomeHeroProps {
    featuredItems?: (ItemData & { id: string })[];
}

export default function HomeHero({ featuredItems }: HomeHeroProps) {
    const mainItem = featuredItems && featuredItems.length > 0 ? featuredItems[0] : null;
    const categoryName = mainItem ? mainItem.category : 'Tecnología';
    
    // Buscar los datos en el mapa de categorías unificado
    const categoryObj = CATEGORIES.find(c => c.name === categoryName);
    const categoryIcon = categoryObj ? categoryObj.icon : 'devices';

    const unsplashId = CATEGORY_IMAGE_MAP[categoryName] || CATEGORY_IMAGE_MAP['default'];
    const imageUrl = `https://images.unsplash.com/photo-${unsplashId}?q=80&w=2426&auto=format&fit=crop`;

    return (
        <section className="bg-white border-b border-gray-100 font-sans mb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                <div className="grid md:grid-cols-12 gap-12 items-center">

                    {/* TEXTO Y CTA (7 columnas en MD) */}
                    <div className="md:col-span-7 space-y-6">
                        <span className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border border-primary-100">
                            <span className="material-symbols-outlined text-base animate-pulse">bolt</span>
                            Tendencias en Vivo
                        </span>

                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-950 font-display leading-[1] uppercase">
                            El mercado <br />
                            <span className="text-primary-600">que siempre funciona.</span>
                        </h1>

                        <p className="text-lg text-slate-600 max-w-2xl font-sans leading-relaxed">
                            Descubre los productos más buscados hoy. <br className="hidden sm:block" />
                            Vende lo que ya no usas de forma fácil y segura.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                to="/search"
                                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-[0.98]"
                            >
                                Explorar Todo
                                <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
                            </Link>
                            <Link
                                to="/publish"
                                className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-800 px-8 py-4 rounded-xl text-base font-semibold hover:bg-slate-200 transition-all active:scale-[0.98]"
                            >
                                Comenzar a Vender
                            </Link>
                        </div>
                    </div>

                    {/* ESPACIO PARA IMAGEN O ILUSTRACIÓN (5 columnas en MD) */}
                    <div className="md:col-span-5 relative group mt-10 md:mt-0">
                        <Link to={`/search?category=${encodeURIComponent(categoryName)}`} className="block relative cursor-pointer">
                            <div className="aspect-[5/4] bg-slate-100 rounded-[40px] overflow-hidden shadow-2xl relative">
                                <img
                                    src={imageUrl}
                                    alt={`Categoría destacada: ${categoryName}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>

                            <style>
                                {`
                                    @keyframes bounce-slow {
                                        0%, 100% { transform: translateY(0); }
                                        50% { transform: translateY(-10px); }
                                    }
                                `}
                            </style>
                            {/* FLOATING CARD: "Categoría del Momento" - AGREGADA AFUERA DEL DOM PRINCIPAL DE LA IMAGEN */}
                            <div 
                                className="absolute -bottom-6 -left-6 md:-left-12 bg-white rounded-3xl p-5 shadow-2xl flex items-center gap-4 border border-slate-50 min-w-[280px] z-20 group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500"
                                style={{ animation: 'bounce-slow 4s ease-in-out infinite' }}
                            >
                                <div className="bg-primary-50 text-primary-500 rounded-2xl w-14 h-14 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-2xl font-black">{categoryIcon}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Categoría del momento</p>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase line-clamp-1">{categoryName}</h3>
                                </div>
                                <span className="material-symbols-outlined text-primary-200 text-3xl font-light group-hover:text-primary-500 group-hover:translate-x-1 transition-all">arrow_forward</span>
                            </div>
                        </Link>

                        {/* Decoración de Fondo */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-30 animate-pulse -z-10 pointer-events-none"></div>
                    </div>

                </div>
            </div>
        </section>
    );
}
