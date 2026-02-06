
import React, { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/marketplace/Home';
import Dashboard from './pages/Dashboard';
import Dispute from './pages/transactions/Dispute';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Verification from './pages/Verification';
import Login from './pages/Login';
import Publish from './pages/publish/Publish';
import Messages from './pages/Messages';
import NewDeal from './pages/publish/NewDeal';
import ProductDetail from './pages/marketplace/ProductDetail';
import Search from './pages/marketplace/Search';
import Checkout from './pages/transactions/Checkout';
import TransactionDetail from './pages/transactions/TransactionDetail';
import Success from './pages/transactions/Success';
import PaymentSuccess from './pages/transactions/PaymentSuccess';
import PaymentFailure from './pages/transactions/PaymentFailure';
import ESgrow from './pages/transactions/ESgrow';
import CompleteProfile from './pages/CompleteProfile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import EscrowInfo from './pages/EscrowInfo';
import VerifyDelivery from './pages/VerifyDelivery';
import RequireProfile from './components/RequireProfile';
import { AuthProvider, useAuth } from './lib/auth';

// --- Voice Search Component ---

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

// --- App Infrastructure ---

interface Notification {
  id: number;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message: string;
  icon: string;
}

interface NotificationContextType {
  notify: (n: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => {
  const styles = {
    success: 'bg-primary-50 text-primary-900 border-primary-100',
    info: 'bg-blue-50 text-blue-900 border-blue-100',
    warning: 'bg-amber-50 text-amber-900 border-amber-100',
    error: 'bg-red-50 text-red-900 border-red-100',
  };

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className={`flex items-start gap-4 p-5 rounded-2xl border shadow-premium mb-4 cursor-pointer transition-all hover:scale-[1.02] pointer-events-auto ${styles[notification.type]}`}
      onClick={() => onDismiss(notification.id)}>
      <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${notification.type === 'success' ? 'bg-primary-vibrant text-white' : 'bg-white'}`}>
        <span className="material-symbols-outlined text-xl">{notification.icon}</span>
      </div>
      <div>
        <h4 className="font-black text-sm leading-none mb-1">{notification.title}</h4>
        <p className="font-bold text-xs opacity-70 leading-tight">{notification.message}</p>
      </div>
    </div>
  );
};


import { subscribeToChats, Chat } from './lib/chat';

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToChats(user.uid, (chats) => {
      const count = chats.reduce((acc, chat) => acc + (chat.unreadCount?.[user.uid] || 0), 0);
      setUnreadCount(count);
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
          <Link className="hover:text-dark-800 transition-colors" to="/dispute">Ayuda</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="relative size-11 rounded-2xl bg-light-50 flex items-center justify-center text-dark-700 hover:bg-light-100 transition-all group">
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">notifications</span>
            {/* Notification Dot Placeholder - Logic to be implemented */}
          </button>

          <button onClick={() => navigate('/messages')} className="relative size-11 rounded-2xl bg-light-50 flex items-center justify-center text-dark-700 hover:bg-light-100 transition-all group">
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">chat_bubble</span>
            {unreadCount > 0 && (
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
                { to: '/publish', label: 'Iniciar Trato', icon: 'handshake' },
                { to: '/verification', label: 'Confianza de Red', icon: 'verified_user' },
                { to: '/wallet', label: 'Índice Financiero', icon: 'payments' },
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

const Footer = () => (
  <footer className="mt-40 py-24 bg-white border-t border-light-200">
    <div className="max-w-[1440px] mx-auto px-6 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-10 opacity-40 grayscale group-hover:grayscale-0 transition-all">
        <span className="material-symbols-outlined text-3xl font-black text-red-600">target</span>
        <h2 className="text-xl font-black tracking-tighter text-red-600">De Oportunidades 🎯</h2>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-12">
        <Link className="hover:text-dark-800 transition-colors" to="/">Protocolos</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/">Cumplimiento</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/">Infraestructura</Link>
        <Link className="hover:text-dark-800 transition-colors" to="/">Nodo de Soporte</Link>
      </div>
      <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.4em] text-center">
        © 2026 De Oportunidades Inc. Transacciones seguras mediante protocolos encriptados.
      </p>
    </div>
  </footer>
);

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {children}
    </div>
  );
};

function App() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notify = useCallback((n: Omit<Notification, 'id'>) => {
    setNotifications(prev => [...prev, { ...n, id: Date.now() }]);
  }, []);
  const dismiss = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify }}>
      <AuthProvider>
        <HashRouter>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen relative font-body text-dark-charcoal">
            <div className="fixed top-24 right-6 z-[100] w-full max-w-sm pointer-events-none flex flex-col items-end">
              {notifications.map(n => <NotificationItem key={n.id} notification={n} onDismiss={dismiss} />)}
            </div>
            <Header />
            <main className="flex-grow">
              <PageTransition>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/publish" element={<RequireProfile><Publish /></RequireProfile>} />
                  <Route path="/new-trato" element={<RequireProfile><NewDeal /></RequireProfile>} />
                  <Route path="/new-trato" element={<RequireProfile><NewDeal /></RequireProfile>} />
                  <Route path="/transaction/:id" element={<RequireProfile><ESgrow /></RequireProfile>} />

                  <Route path="/dashboard" element={<RequireProfile><Dashboard /></RequireProfile>} />
                  <Route path="/messages" element={<RequireProfile><Messages /></RequireProfile>} />
                  <Route path="/messages/:chatId" element={<RequireProfile><Messages /></RequireProfile>} />
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/profile/:uid?" element={<Profile />} />
                  <Route path="/complete-profile" element={<CompleteProfile />} />
                  <Route path="/settings" element={<RequireProfile><Settings /></RequireProfile>} />
                  <Route path="/login" element={<Login />} />

                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/failure" element={<PaymentFailure />} />
                  <Route path="/payment/pending" element={<PaymentSuccess />} />
                  <Route path="/dispute" element={<Dispute />} />
                  <Route path="/verification" element={<Verification />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/escrow-info" element={<EscrowInfo />} />
                  <Route path="/verify-delivery" element={<VerifyDelivery />} />
                </Routes>
              </PageTransition>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </AuthProvider>
    </NotificationContext.Provider>
  );
}

export default App;
