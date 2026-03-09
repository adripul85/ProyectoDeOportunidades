import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useNotification } from '../context/NotificationContext';
import { useFirestoreNotifications } from '../hooks/useFirestoreNotifications';
import { useCart } from '../context/CartContext';
import { subscribeToChats } from '../lib/chat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Voice Search Component (Internal for now) ---
const VoiceSearchModal = ({ isOpen, onClose, onResult }: { isOpen: boolean, onClose: () => void, onResult: (text: string) => void }) => {
    const [transcription, setTranscription] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Su navegador no soporta búsqueda por voz.");
            onClose();
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.lang = 'es-AR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            let interimTranscription = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    onResult(event.results[i][0].transcript);
                    onClose();
                } else {
                    interimTranscription += event.results[i][0].transcript;
                }
            }
            setTranscription(interimTranscription);
        };
        recognition.onerror = () => stopListening();
        recognition.onend = () => setIsListening(false);

        recognition.start();
    }, [onResult, onClose, stopListening]);

    useEffect(() => {
        if (isOpen) {
            startListening();
        } else {
            stopListening();
        }
        return () => stopListening();
    }, [isOpen, startListening, stopListening]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-white p-12 max-w-lg w-full text-center rounded-[40px] border border-slate-100 shadow-premium relative animate-in zoom-in-95 duration-500">
                <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
                    <span className="material-symbols-outlined font-black">close</span>
                </button>

                <div className="size-32 bg-slate-50 rounded-full mx-auto mb-10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20"></div>
                    <span className="material-symbols-outlined text-5xl text-primary-600 font-black animate-pulse">mic</span>
                </div>

                <h3 className="text-3xl font-black text-slate-900 mb-4 font-display">Escuchando...</h3>

                <div className="min-h-[140px] flex items-center justify-center p-8 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 mb-10">
                    <p className="text-xl font-bold text-slate-900 leading-tight italic opacity-60">
                        {transcription || 'Hable ahora...'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">CANCELAR</button>
                    <button
                        onClick={() => { if (transcription) { onResult(transcription); onClose(); } }}
                        className="flex-1 bg-slate-900 text-white rounded-full py-4 text-xs font-bold uppercase tracking-widest hover:bg-black transition-all"
                    >
                        BUSCAR AHORA
                    </button>
                </div>
            </div>
        </div>
    );
};

const Header = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const { cart } = useCart();

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToChats(user.uid, (chats) => {
            const count = chats.reduce((acc, chat) => acc + (chat.unreadCount?.[user.uid] || 0), 0);
            setUnreadChatCount(count);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSearch = (e?: React.FormEvent, term?: string) => {
        if (e) e.preventDefault();
        const finalTerm = (term || searchTerm).trim();
        if (finalTerm) {
            navigate(`/search?q=${encodeURIComponent(finalTerm)}`);
            setSearchTerm('');
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 shadow-sm font-sans">
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">

                {/* LOGO */}
                <Link to="/" className="flex items-center gap-1 group shrink-0">
                    <span className="material-symbols-outlined text-primary-600 text-3xl group-hover:rotate-12 transition-transform">
                        bolt
                    </span>
                    <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display hidden sm:block">
                        Vendelo<span className="text-primary-600">Ya!</span>
                    </span>
                </Link>

                {/* BUSCADOR */}
                <form onSubmit={(e) => handleSearch(e)} className="hidden md:flex flex-1 max-w-md group relative">
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within:text-primary-600 transition-colors">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar productos, marcas y más..."
                            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all text-sm outline-none text-slate-600 font-medium placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => setIsVoiceSearchOpen(true)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-primary-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">mic</span>
                        </button>
                    </div>
                </form>

                {/* ACCIONES */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Mobile Search Toggle */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600"
                    >
                        <span className="material-symbols-outlined text-xl">{isMobileMenuOpen ? 'close' : 'search'}</span>
                    </button>

                    <Link
                        to="/cart"
                        className="relative size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">shopping_cart</span>
                        {cart.length > 0 && (
                            <div className="absolute -top-1 -right-1 size-4 bg-primary-vibrant text-white text-[9px] font-black rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 border-2 border-white">
                                {cart.length}
                            </div>
                        )}
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/publish"
                                className="hidden lg:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-sm"
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                Vender
                            </Link>

                            <div className="relative">
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="size-10 rounded-full border-2 border-slate-100 p-0.5 overflow-hidden hover:border-primary-600 transition-all shadow-sm"
                                >
                                    <img
                                        className="w-full h-full rounded-full object-cover"
                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.displayName || user?.displayName || user.email?.split('@')[0] || 'U')}&background=random`}
                                        alt="Profile"
                                    />
                                </button>

                                {isUserMenuOpen && (
                                    <div className="absolute top-12 right-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-premium p-2 animate-in fade-in slide-in-from-top-2 duration-300 z-[100]">
                                        <div className="p-3 bg-slate-50 rounded-xl mb-1 flex items-center gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 text-sm truncate">{userProfile?.displayName || user.displayName}</p>
                                                <p className="text-[10px] font-medium text-slate-500 truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="py-1">
                                            {[
                                                { to: '/dashboard', label: 'Mi Panel', icon: 'grid_view' },
                                                { to: `/shop/${user.uid}`, label: 'Mi Tienda', icon: 'storefront' },
                                                ...(userProfile?.role === 'admin' ? [{ to: '/admin', label: 'Panel Admin', icon: 'admin_panel_settings' }] : []),
                                                { to: '/messages', label: 'Mensajes', icon: 'chat_bubble', count: unreadChatCount },
                                                { to: '/settings', label: 'Configuración', icon: 'settings' },
                                                { to: '/wallet', label: 'Mi Billetera', icon: 'account_balance_wallet' },
                                            ].map(item => (
                                                <Link
                                                    key={item.to}
                                                    to={item.to}
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="material-symbols-outlined text-xl">{item.icon}</span>
                                                        <span className="text-sm font-medium">{item.label}</span>
                                                    </div>
                                                    {item.count ? (
                                                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                            {item.count}
                                                        </span>
                                                    ) : null}
                                                </Link>
                                            ))}
                                            <div className="h-px bg-slate-100 my-1"></div>
                                            <button
                                                onClick={() => { logout(); setIsUserMenuOpen(false); navigate('/'); }}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 transition-all text-left"
                                            >
                                                <span className="material-symbols-outlined text-xl">logout</span>
                                                <span className="text-sm font-medium">Cerrar Sesión</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-primary-600 transition-colors">
                                Ingresar
                            </Link>
                            <Link
                                to="/register"
                                className="bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-700 transition-all shadow-md shadow-primary-500/10"
                            >
                                Crear cuenta
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Search Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden p-4 border-t border-slate-100 bg-white animate-in slide-in-from-top duration-300">
                    <form onSubmit={(e) => handleSearch(e)} className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="¿Qué estás buscando?"
                            className="w-full bg-slate-100 border-none rounded-xl py-3 px-4 outline-none font-medium text-sm"
                        />
                        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">
                            <span className="material-symbols-outlined">search</span>
                        </button>
                    </form>
                    <nav className="mt-4 grid grid-cols-2 gap-2">
                        <Link to="/" className="p-3 bg-slate-50 rounded-xl text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">explore</span> Explorar
                        </Link>
                        {userProfile?.role === 'admin' && (
                            <Link to="/admin" className="p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">admin_panel_settings</span> Admin
                            </Link>
                        )}
                        <Link to="/deals" className="p-3 bg-slate-50 rounded-xl text-[10px] font-bold uppercase text-slate-500 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">local_offer</span> Deals
                        </Link>
                    </nav>
                </div>
            )}

            <VoiceSearchModal
                isOpen={isVoiceSearchOpen}
                onClose={() => setIsVoiceSearchOpen(false)}
                onResult={(text) => handleSearch(undefined, text)}
            />
        </header>
    );
};

export default Header;
