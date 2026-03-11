import React from 'react';
import { Link } from 'react-router-dom';
import { ItemData } from '../lib/items';

interface HomeHeroProps {
    featuredItems?: (ItemData & { id: string })[];
}

export default function HomeHero({ featuredItems }: HomeHeroProps) {
    const mainItem = featuredItems?.[0];

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
                    <div className="md:col-span-5 relative group">
                        <div className="aspect-[5/4] bg-slate-100 rounded-4xl overflow-hidden border border-gray-100 shadow-premium group-hover:shadow-2xl transition-all duration-700">
                            {mainItem ? (
                                <Link to={`/search?category=${encodeURIComponent(mainItem.category)}`}>
                                    <img
                                        src={mainItem.images?.[0] || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"}
                                        alt={mainItem.category}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
                                            <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest mb-1">Categoría más buscada</p>
                                            <h3 className="text-lg font-black text-slate-950 truncate uppercase tracking-tighter">{mainItem.category}</h3>
                                            <p className="text-primary-600 font-black text-sm tracking-tight mt-1">Explorar tendencias</p>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <img
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                                    alt="Ilustración Vendelo Ya!"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                            )}
                        </div>

                        {/* Decoración de Fondo */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    </div>

                </div>
            </div>
        </section>
    );
}
