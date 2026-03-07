import React from 'react';
import { Link } from 'react-router-dom';

export default function HomeHero() {
    return (
        <section className="bg-white border-b border-gray-100 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="grid md:grid-cols-12 gap-12 items-center">

                    {/* TEXTO Y CTA (7 columnas en MD) */}
                    <div className="md:col-span-7 space-y-6">
                        <span className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border border-primary-100">
                            <span className="material-symbols-outlined text-base animate-pulse">bolt</span>
                            Ofertas Relámpago en Vivo
                        </span>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 font-display leading-[1.1]">
                            Las mejores ofertas, <br />
                            <span className="text-primary-600">en un solo lugar.</span>
                        </h1>

                        <p className="text-lg text-slate-600 max-w-2xl font-sans leading-relaxed">
                            Descubre productos únicos con descuentos increíbles por tiempo limitado. <br className="hidden sm:block" />
                            Vende lo que ya no usas de forma fácil y segura.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Link
                                to="/deals"
                                className="inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-[0.98]"
                            >
                                Explorar Ofertas
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
                        <div className="aspect-[5/4] bg-slate-100 rounded-3xl overflow-hidden border border-gray-100 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                            {/* Aquí iría la imagen o ilustración principal del banner */}
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                                alt="Ilustración DeOportunidades"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />

                            {/* Overlay Decorativo */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent"></div>

                            {/* Flotante: Categoría Destacada (Hot Linker) */}
                            <Link
                                to="/home?category=Tecnología"
                                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 animate-float whitespace-nowrap hover:scale-105 hover:shadow-2xl transition-all group/card"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 border border-primary-200 group-hover/card:bg-primary-600 group-hover/card:text-white transition-colors">
                                    <span className="material-symbols-outlined text-2xl">devices</span>
                                </div>
                                <div className="pr-2">
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Categoría del Momento</p>
                                    <p className="text-lg font-black text-slate-950 tracking-tighter uppercase leading-none">Tecnología</p>
                                </div>
                                <span className="material-symbols-outlined text-primary-200 group-hover/card:text-primary-vibrant transition-colors">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Decoración de Fondo */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-50 rounded-full blur-3xl opacity-60"></div>
                    </div>

                </div>
            </div>
        </section>
    );
}
