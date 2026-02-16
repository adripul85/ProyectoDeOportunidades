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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-dark-800/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-white p-12 max-w-lg w-full text-center rounded-[40px] border border-light-200 shadow-premium relative animate-in zoom-in-95 duration-500">
                <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-dark-800 transition-colors">
                    <span className="material-symbols-outlined font-black">close</span>
                </button>

                <div className="size-32 bg-primary-50 rounded-full mx-auto mb-10 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-20"></div>
                    <span className="material-symbols-outlined text-5xl text-primary-vibrant font-black animate-pulse">mic</span>
                </div>

                <h3 className="text-3xl font-black text-dark-800 mb-4">Escuchando...</h3>

                <div className="min-h-[140px] flex items-center justify-center p-8 bg-light-50 rounded-[32px] border-2 border-dashed border-light-200 mb-10">
                    <p className="text-xl font-bold text-dark-800 leading-tight italic opacity-60">
                        {transcription || 'Hable ahora...'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 btn-secondary !rounded-full py-4 text-xs">CANCELAR</button>
                    <button
                        onClick={() => { if (transcription) { onResult(transcription); onClose(); } }}
                        className="flex-1 btn-primary !rounded-full py-4 text-xs"
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
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const { notifications, unreadCount: unreadNotifCount, markAsRead, markAllAsRead } = useFirestoreNotifications();
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
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-light-200/50">
            <div className="max-w-[1440px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
                <div className="flex items-center gap-10 flex-1">
                    <Link to="/" className="flex items-center gap-3 group shrink-0">
                        <div className="size-10 bg-red-600 text-white rounded-[14px] flex items-center justify-center transition-all group-hover:scale-105 shadow-lg shadow-red-600/20">
                            <span className="material-symbols-outlined text-2xl font-black">target</span>
                        </div>
                        <h2 className="text-xl font-black tracking-tighter text-red-600 hidden md:block">De Oportunidades 🎯</h2>
                    </Link>

                    <form onSubmit={(e) => handleSearch(e)} className="hidden lg:flex flex-1 max-w-xl group relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-vibrant transition-colors pointer-events-none">
                            <span className="material-symbols-outlined text-xl">search</span>
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar productos..."
                            className="w-full bg-light-100/50 border-none rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-primary-100 text-[13px] transition-all outline-none font-bold placeholder:text-gray-400"
                        />
                        <button type="button" onClick={() => setIsVoiceSearchOpen(true)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary-vibrant transition-colors">
                            <span className="material-symbols-outlined text-xl">mic</span>
                        </button>
                    </form>
                </div>

                <nav className="hidden xl:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                    <Link className="hover:text-dark-800 transition-colors" to="/">Explorar</Link>
                    <Link className="hover:text-dark-800 transition-colors" to="/deals">Tratos</Link>
                    <Link className="hover:text-dark-800 transition-colors" to="/publish">Vender</Link>
                    <Link className="hover:text-dark-800 transition-colors" to="/resolution-center">Ayuda</Link>
                </nav>

                <div className="flex items-center gap-4">
                    {/* Cart Icon */}
                    <Link
                        to="/cart"
                        className="relative size-11 rounded-2xl bg-light-50 flex items-center justify-center text-dark-700 hover:bg-light-100 transition-all group"
                    >
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">shopping_cart</span>
                        {cart.length > 0 && (
                            <div className="absolute -top-1 -right-1 size-5 bg-primary-vibrant text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 border-2 border-white animate-in zoom-in duration-300">
                                {cart.length}
                            </div>
                        )}
                    </Link>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative size-11 rounded-2xl bg-light-50 flex items-center justify-center text-dark-700 hover:bg-light-100 transition-all group"
                        >
                            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">notifications</span>
                            {unreadNotifCount > 0 && (
                                <div className="absolute top-2.5 right-2.5 size-2.5 bg-red-500 border-2 border-white rounded-full shadow-sm animate-pulse" />
                            )}
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute top-14 right-0 w-80 sm:w-96 bg-white border border-light-200 rounded-3xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="p-4 border-b border-light-100 flex items-center justify-between bg-light-50/50">
                                    <h3 className="font-black text-dark-800 text-xs uppercase tracking-widest">Notificaciones</h3>
                                    {unreadNotifCount > 0 && (
                                        <button onClick={markAllAsRead} className="text-[9px] font-bold text-primary-vibrant hover:text-primary-700 transition-colors">
                                            MARCAR LEÍDAS
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center text-gray-400">
                                            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">notifications_off</span>
                                            <p className="text-xs font-bold">Sin notificaciones</p>
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                className={`p-4 border-b border-light-100 hover:bg-light-50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => {
                                                    markAsRead(n.id);
                                                    if (n.link) navigate(n.link);
                                                    setIsNotificationsOpen(false);
                                                }}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`mt-1 size-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'success' ? 'bg-green-100 text-green-600' :
                                                        n.type === 'error' ? 'bg-red-100 text-red-600' :
                                                            n.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                                'bg-blue-100 text-blue-600'
                                                        }`}>
                                                        <span className="material-symbols-outlined text-base">
                                                            {n.type === 'success' ? 'check_circle' :
                                                                n.type === 'error' ? 'error' :
                                                                    n.type === 'warning' ? 'warning' : 'info'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-dark-800 text-sm leading-tight mb-1">{n.title}</p>
                                                        <p className="text-xs text-gray-500 leading-snug mb-2">{n.message}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                            {n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), 'd MMM, HH:mm', { locale: es }) : 'Reciente'}
                                                        </p>
                                                    </div>
                                                    {!n.read && (
                                                        <div className="size-2 bg-blue-500 rounded-full mt-2 shrink-0" />
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-2 bg-light-50 text-center border-t border-light-100">
                                    <Link to="/settings" onClick={() => setIsNotificationsOpen(false)} className="text-[9px] font-black text-gray-400 hover:text-dark-800 uppercase tracking-widest transition-colors">
                                        Configurar Notificaciones
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => navigate('/messages')} className="relative size-11 rounded-2xl bg-light-50 flex items-center justify-center text-dark-700 hover:bg-light-100 transition-all group">
                        <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">chat_bubble</span>
                        {unreadChatCount > 0 && (
                            <div className="absolute top-2.5 right-2.5 size-2.5 bg-primary-vibrant border-2 border-white rounded-full shadow-sm animate-pulse" />
                        )}
                    </button>

                    {user ? (
                        <div className="relative ml-2">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="size-11 rounded-full border-2 border-light-100 p-0.5 overflow-hidden hover:border-primary-vibrant transition-all shadow-sm"
                            >
                                <img className="w-full h-full rounded-full object-cover" src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="Profile" />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute top-16 right-0 w-72 bg-white border border-light-200 rounded-[32px] shadow-premium p-4 animate-in fade-in slide-in-from-top-2 duration-300 z-[100]">
                                    <div className="p-5 bg-light-50 rounded-2xl mb-3 flex items-center gap-4">
                                        <img className="size-12 rounded-full object-cover shadow-sm border border-white" src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="User" />
                                        <div className="min-w-0">
                                            <p className="font-black text-dark-800 text-sm truncate">{user.displayName || user.email?.split('@')[0]}</p>
                                            <p className="text-[9px] font-black text-primary-vibrant uppercase tracking-widest mt-1">Miembro Verificado</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {[
                                            { to: '/dashboard', label: 'Panel de Control', icon: 'grid_view' },
                                            ...(userProfile?.role === 'admin' ? [{ to: '/admin', label: 'Panel Admin', icon: 'admin_panel_settings' }] : []),
                                            { to: '/settings', label: 'Configuración', icon: 'settings' },
                                            { to: '/wallet', label: 'Billetera Segura', icon: 'account_balance_wallet' },
                                            { to: '/profile', label: 'Perfil Público', icon: 'account_circle' },
                                            { to: '/verification', label: 'Estado de Identidad', icon: 'verified' },
                                        ].map(item => (
                                            <Link
                                                key={item.to}
                                                to={item.to}
                                                onClick={() => setIsUserMenuOpen(false)}
                                                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-light-50 text-dark-700 transition-all group"
                                            >
                                                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                                            </Link>
                                        ))}
                                        <div className="pt-2 border-t border-light-100 mt-2">
                                            <button
                                                onClick={() => { logout(); setIsUserMenuOpen(false); navigate('/'); }}
                                                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-50 text-red-500 transition-all text-left"
                                            >
                                                <span className="material-symbols-outlined text-xl">logout</span>
                                                <span className="text-[11px] font-black uppercase tracking-widest">Cerrar Sesión</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="ml-4 h-11 px-8 bg-dark-800 text-white rounded-[14px] font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-dark-900 transition-all active:scale-95 shadow-xl shadow-dark-800/10">Acceder al Portal</Link>
                    )}

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="xl:hidden size-11 rounded-2xl bg-light-50 flex items-center justify-center text-dark-800 transition-all hover:bg-light-100"
                    >
                        <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="xl:hidden fixed inset-x-0 top-20 bg-white/95 backdrop-blur-xl border-b border-light-200 shadow-2xl animate-in slide-in-from-top duration-500 z-40 overflow-hidden rounded-b-[40px]">
                    <div className="p-8 space-y-10">
                        <form onSubmit={(e) => handleSearch(e)} className="relative group">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar en la red..."
                                className="w-full bg-light-50 border-2 border-transparent focus:border-primary-100 rounded-2xl py-4 px-6 outline-none font-black text-sm transition-all"
                            />
                            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-800 group-focus-within:text-primary-vibrant">
                                <span className="material-symbols-outlined font-black">search</span>
                            </button>
                        </form>

                        <nav className="grid grid-cols-2 gap-4">
                            {[
                                { to: '/search', label: 'Explorar Activos', icon: 'explore' },
                                { to: '/deals', label: 'Tratos', icon: 'local_offer' },
                                { to: '/publish', label: 'Iniciar Trato', icon: 'handshake' },
                                { to: '/verification', label: 'Confianza de Red', icon: 'verified_user' },
                                { to: '/wallet', label: 'Índice Financiero', icon: 'payments' },
                                { to: '/cart', label: 'Carrito', icon: 'shopping_cart' },
                            ].map(item => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex flex-col gap-4 p-6 bg-light-50 rounded-[28px] hover:bg-primary-50 transition-all group items-center text-center"
                                >
                                    <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 group-hover:text-primary-vibrant group-hover:scale-110 transition-all shadow-sm">
                                        <span className="material-symbols-outlined text-2xl font-black">{item.icon}</span>
                                    </div>
                                    <span className="font-black text-[9px] uppercase tracking-[0.2em] text-gray-400 group-hover:text-dark-800">{item.label}</span>
                                </Link>
                            ))}
                        </nav>

                        <div className="pt-8 border-t border-light-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="size-2 bg-primary-vibrant rounded-full animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]"></span>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nodo de Soporte Activo</p>
                            </div>
                            <span className="text-[9px] font-black text-dark-800/20 tracking-tighter">PROTO-MARKET-V2</span>
                        </div>
                    </div>
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
