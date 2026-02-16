import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
    const { cart, removeFromCart, total, clearCart } = useCart();
    const navigate = useNavigate();

    if (cart.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-20 min-h-screen text-center">
                <div className="size-32 bg-light-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <span className="material-symbols-outlined text-6xl text-gray-400">shopping_cart_off</span>
                </div>
                <h1 className="text-4xl font-black text-dark-800 uppercase tracking-tight mb-4">Tu carrito está vacío</h1>
                <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium">¿Viste algo que te gustó? ¡Agrégalo al carrito para no perderlo de vista!</p>
                <Link to="/" className="btn-primary px-12 py-5 inline-block">
                    Explorar Oportunidades
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-20 min-h-screen">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
                <div>
                    <h1 className="text-4xl font-black text-dark-800 tracking-tight uppercase">Mi Carrito</h1>
                    <p className="text-[10px] font-black text-primary-vibrant uppercase tracking-[0.3em] mt-2">
                        {cart.length} {cart.length === 1 ? 'Producto' : 'Productos'} seleccionados
                    </p>
                </div>
                <button
                    onClick={clearCart}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors flex items-center gap-2 group"
                >
                    <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">delete_sweep</span>
                    Vaciar Carrito
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* List */}
                <div className="lg:col-span-8 space-y-6">
                    {cart.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white p-6 rounded-[32px] border border-light-200 shadow-sm hover:shadow-premium transition-all flex gap-6 items-center"
                        >
                            <img
                                src={item.image}
                                alt={item.title}
                                className="size-24 rounded-2xl object-cover border border-light-100"
                            />
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-dark-800 mb-1">{item.title}</h3>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Vendido por {item.sellerName}</p>
                                <p className="text-2xl font-black text-dark-800 mt-2">${item.price.toLocaleString()}</p>
                            </div>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="size-12 bg-light-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all flex items-center justify-center group"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">delete</span>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="lg:col-span-4">
                    <div className="bg-dark-800 p-8 rounded-[40px] text-white shadow-2xl sticky top-24 border border-white/5 overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-vibrant/20 blur-[80px] rounded-full"></div>

                        <h3 className="text-xl font-black uppercase tracking-tight mb-8 relative z-10">Resumen de Compra</h3>

                        <div className="space-y-4 mb-8 relative z-10">
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/50">
                                <span>Subtotal ({cart.length} ítems)</span>
                                <span>${total.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/50">
                                <span>Costo de Protección</span>
                                <span className="text-emerald-400">Gratis (Escrow)</span>
                            </div>
                            <div className="h-px bg-white/10 my-6"></div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Total Final</span>
                                <span className="text-4xl font-black tracking-tighter text-primary-vibrant">${total.toLocaleString()}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full btn-primary bg-primary-vibrant text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            Comprar Todo
                            <span className="material-symbols-outlined font-black">arrow_forward</span>
                        </button>
                        <p className="text-[9px] text-center mt-6 font-black uppercase tracking-widest opacity-30 leading-relaxed">
                            Tus fondos están protegidos por nuestro sistema de Escrow inteligente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
