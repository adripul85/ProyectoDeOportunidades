
import React, { useState, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Dispute from './pages/Dispute';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import Verification from './pages/Verification';
import Login from './pages/Login';
import NewDeal from './pages/NewDeal';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import ESgrow from './pages/ESgrow';

// --- Voice Search Component ---

const VoiceSearchModal = ({ isOpen, onClose, onResult }: { isOpen: boolean, onClose: () => void, onResult: (text: string) => void }) => {
  const [transcription, setTranscription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stopListening = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    try {
      setTranscription('');
      setIsListening(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscription(prev => prev + message.serverContent!.inputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) {
              // Final transcription complete
              setTranscription(current => {
                if (current.trim()) {
                  setTimeout(() => {
                    onResult(current.trim());
                    onClose();
                  }, 500);
                }
                return current;
              });
            }
          },
          onerror: () => stopListening(),
          onclose: () => setIsListening(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: 'User is searching for products in a marketplace. Just transcribe the search keywords accurately.',
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Mic error:", err);
      stopListening();
    }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-charcoal/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
      <div className="bg-white hand-drawn-card p-12 max-w-lg w-full text-center rotate-[-1deg] border-4 border-dark-charcoal shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-dark-charcoal">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="size-32 bg-menta/20 rounded-blob mx-auto mb-8 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-menta/40 rounded-blob animate-ping opacity-20"></div>
          <span className="material-symbols-outlined text-6xl text-menta-dark animate-pulse">mic</span>
        </div>

        <h3 className="text-3xl font-black font-display mb-4">Te escuchamos... 🎤</h3>
        
        <div className="min-h-[100px] flex items-center justify-center p-6 bg-papel/50 rounded-3xl border-2 border-dashed border-dark-charcoal/10 mb-8">
          <p className="font-handwritten text-3xl text-dark-charcoal leading-tight italic">
            {transcription || 'Di algo como "Monitor Gamer"'}
          </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-white text-dark-charcoal font-black rounded-full border-3 border-dark-charcoal shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { if (transcription) { onResult(transcription); onClose(); } }}
            className="flex-1 py-4 bg-menta text-dark-charcoal font-black rounded-full border-3 border-dark-charcoal shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Listo
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
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: number) => void }> = ({ notification, onDismiss }) => {
  const colors = {
    success: 'bg-menta',
    info: 'bg-sky-soft',
    warning: 'bg-lemon-soft',
    error: 'bg-coral-soft',
  };

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div className={`flex items-start gap-4 p-5 rounded-3xl border-2 border-dark-charcoal shadow-lg mb-4 cursor-pointer transition-all hover:scale-105 pointer-events-auto ${colors[notification.type]}`}
         onClick={() => onDismiss(notification.id)}>
      <div className="bg-white/80 p-2 rounded-full border border-dark-charcoal">
        <span className="material-symbols-outlined text-2xl">{notification.icon}</span>
      </div>
      <div>
        <h4 className="font-display font-bold text-sm leading-none mb-1">{notification.title}</h4>
        <p className="font-semibold text-xs text-dark-charcoal/70 leading-tight">{notification.message}</p>
      </div>
    </div>
  );
};

const Header = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const finalTerm = term || searchTerm;
    const cleanTerm = finalTerm.trim();
    if (cleanTerm) {
      navigate(`/search?q=${encodeURIComponent(cleanTerm)}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b-2 border-dashed border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between gap-8">
        <div className="flex items-center gap-8 flex-1">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="size-10 sm:size-12 bg-menta organic-border flex items-center justify-center transition-transform group-hover:rotate-12">
              <span className="material-symbols-outlined text-dark-charcoal text-2xl sm:text-3xl font-bold">volunteer_activism</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 hidden sm:block font-display">De Oportunidades</h2>
          </Link>
          
          <form onSubmit={(e) => handleSearch(e)} className="hidden md:flex flex-1 max-w-md group">
            <div className="relative w-full flex items-center">
              <span className="absolute left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-menta-dark transition-colors">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca tu próximo tesoro..."
                className="w-full bg-slate-100 border-2 border-transparent rounded-full py-2.5 pl-12 pr-24 focus:bg-white focus:border-menta/50 focus:ring-4 focus:ring-menta/10 text-sm transition-all outline-none font-medium" 
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => setIsVoiceSearchOpen(true)}
                  className="p-2 text-slate-400 hover:text-menta-dark transition-colors"
                  title="Búsqueda por voz"
                >
                  <span className="material-symbols-outlined">mic</span>
                </button>
                <button 
                  type="submit"
                  className="bg-dark-charcoal text-white p-2 rounded-full flex items-center justify-center hover:bg-menta hover:text-dark-charcoal transition-all active:scale-90"
                >
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <nav className="hidden lg:flex items-center gap-8 font-bold text-sm">
          <Link className="hover:text-menta-dark transition-colors" to="/search">Categorías</Link>
          <Link className="hover:text-menta-dark transition-colors" to="/new-trato">Vender</Link>
          <a className="hover:text-menta-dark transition-colors" href="#">Ayuda</a>
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/wallet" className="size-10 flex items-center justify-center hover:bg-menta/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </Link>
          <Link to="/login" className="size-11 rounded-full bg-menta p-0.5 shadow-sm border-2 border-white overflow-hidden hover:scale-105 transition-transform">
            <img className="w-full h-full object-cover rounded-full" src="https://picsum.photos/100/100?avatar=current" alt="Profile" />
          </Link>
        </div>
      </div>
      
      <VoiceSearchModal 
        isOpen={isVoiceSearchOpen} 
        onClose={() => setIsVoiceSearchOpen(false)} 
        onResult={(text) => handleSearch(undefined, text)} 
      />
    </header>
  );
};

const Footer = () => (
  <footer className="mt-32 pb-16 bg-white border-t-4 border-dashed border-slate-100">
    <div className="max-w-[1280px] mx-auto px-6 pt-20 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 space-y-6">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-menta organic-border flex items-center justify-center">
            <span className="material-symbols-outlined text-dark-charcoal">volunteer_activism</span>
          </div>
          <h2 className="text-xl font-bold font-display">De Oportunidades</h2>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          Haciendo que cada trato se sienta como un apretón de manos honesto. La confianza es el motor principal.
        </p>
      </div>
      <div>
        <h4 className="font-bold text-lg mb-6">Tu Seguridad</h4>
        <ul className="text-sm text-slate-500 space-y-4">
          <li><Link className="hover:text-menta-dark" to="/verification">Paso a Paso</Link></li>
          <li><Link className="hover:text-menta-dark" to="/dispute">Resolución</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-lg mb-6">Comunidad</h4>
        <ul className="text-sm text-slate-500 space-y-4">
          <li><a className="hover:text-menta-dark" href="#">Historias</a></li>
          <li><a className="hover:text-menta-dark" href="#">Ayuda</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-lg mb-6">Salúdanos</h4>
        <div className="flex gap-4">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-menta cursor-pointer">
            <span className="material-symbols-outlined">alternate_email</span>
          </div>
        </div>
      </div>
    </div>
    <div className="max-w-[1280px] mx-auto px-6 mt-20 pt-8 border-t border-slate-100 text-center">
      <p className="font-hand text-xl text-slate-400">Hecho con cariño © 2024</p>
    </div>
  </footer>
);

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
      <HashRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen relative">
          <div className="fixed top-24 right-6 z-[100] w-full max-w-sm pointer-events-none flex flex-col items-end">
            {notifications.map(n => <NotificationItem key={n.id} notification={n} onDismiss={dismiss} />)}
          </div>
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dispute" element={<Dispute />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/login" element={<Login />} />
              <Route path="/new-trato" element={<NewDeal />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/success" element={<Success />} />
              <Route path="/esgrow/:id" element={<ESgrow />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </NotificationContext.Provider>
  );
}

export default App;
