
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../App';
import { GoogleGenAI } from '@google/genai';

type EscrowStatus = 'PACTADO' | 'FONDEADO' | 'ENVIADO' | 'RECIBIDO' | 'FINALIZADO' | 'DISPUTA';
type UserRole = 'COMPRADOR' | 'VENDEDOR' | 'MEDIADOR';

const ESgrow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  // --- States ---
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('COMPRADOR'); // Simulated toggle
  const [status, setStatus] = useState<EscrowStatus>('FONDEADO');
  const [deadline, setDeadline] = useState<Date | null>(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // 3 days from now
  const [isVerifyingAI, setIsVerifyingAI] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'vendedor', text: '¡Hola! Ya tengo el iPhone listo. Lo embalé con doble burbuja para que llegue perfecto. 📦', time: '10:30 AM' },
    { role: 'comprador', text: '¡Genial! Muchas gracias. Quedo atento al envío.', time: '10:45 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [evidence, setEvidence] = useState([
    { id: 1, url: 'https://picsum.photos/400/400?tech=1', type: 'Envío', user: 'Juan', aiVerified: true },
    { id: 2, url: 'https://picsum.photos/400/400?tech=2', type: 'Detalle', user: 'Juan', aiVerified: false }
  ]);

  const dealData = {
    id: id || 'TRX-8829',
    title: "iPhone 13 Pro Max - 128GB",
    price: 450000,
    startDate: '12 de Octubre',
    seller: {
      name: "Juan Pérez",
      avatar: "https://picsum.photos/400/400?person=1",
      reputation: "9.8",
      points: "1,240",
      level: "Vendedor Épico"
    },
    buyer: {
      name: "Tú",
      avatar: "https://picsum.photos/100/100?avatar=current",
      points: "450",
      level: "Buen Vecino"
    }
  };

  const steps: { status: EscrowStatus; label: string; icon: string; desc: string }[] = [
    { status: 'PACTADO', label: 'Pactado', icon: 'handshake', desc: 'Acuerdo sellado' },
    { status: 'FONDEADO', label: 'Fondeado', icon: 'account_balance_wallet', desc: 'Dinero en cofre' },
    { status: 'ENVIADO', label: 'Enviado', icon: 'local_shipping', desc: 'En camino' },
    { status: 'RECIBIDO', label: 'Recibido', icon: 'package_2', desc: 'En tus manos' },
    { status: 'FINALIZADO', label: 'Finalizado', icon: 'task_alt', desc: 'Éxito total' }
  ];

  const currentStepIdx = steps.findIndex(s => s.status === status);

  // --- Countdown Timer Logic ---
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!deadline || status === 'FINALIZADO' || status === 'DISPUTA') return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = deadline.getTime() - now;
      if (distance < 0) {
        setTimeLeft('¡TIEMPO AGOTADO!');
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, status]);

  // --- AI Verification with Gemini ---
  const verifyImageWithAI = async (imageUrl: string) => {
    setIsVerifyingAI(true);
    try {
      const genAI = new GoogleGenAI(process.env.API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // In a real browser environment, we'd need to fetch the image and convert to base64
      // For this demo, we'll simulate the AI result after a short delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      notify({
        type: 'success',
        title: 'IA: Evidencia Validada ✨',
        message: 'La imagen parece coincidir con un paquete de envío legítimo.',
        icon: 'auto_awesome'
      });
      return true;
    } catch (err) {
      console.error("AI error:", err);
      return false;
    } finally {
      setIsVerifyingAI(false);
    }
  };

  const handleUploadPhoto = async () => {
    const newPhotoUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
    const newPhoto = {
      id: Date.now(),
      url: newPhotoUrl,
      type: currentUserRole === 'VENDEDOR' ? 'Envío' : 'Recepción',
      user: currentUserRole === 'VENDEDOR' ? dealData.seller.name : 'Tú',
      aiVerified: false
    };

    setEvidence(prev => [...prev, newPhoto]);

    notify({
      type: 'info',
      title: 'Subiendo... 📸',
      message: 'Estamos procesando tu evidencia con nuestra IA.',
      icon: 'hourglass_top'
    });

    const isVerified = await verifyImageWithAI(newPhotoUrl);
    setEvidence(prev => prev.map(p => p.id === newPhoto.id ? { ...p, aiVerified: isVerified } : p));
  };

  const downloadDealChat = () => {
    const content = `=== BITÁCORA DE PALABRAS ===\nTrato: #${dealData.id}\nEstado: ${status}\n\n` +
      messages.map(m => `[${m.time}] ${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bitacora_${dealData.id}.txt`;
    link.click();
    notify({ type: 'info', title: 'Bitácora Guardada 📜', message: 'Historial descargado.', icon: 'description' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      role: currentUserRole.toLowerCase(),
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');
  };

  const toggleRole = () => {
    const nextRole = currentUserRole === 'COMPRADOR' ? 'VENDEDOR' : 'COMPRADOR';
    setCurrentUserRole(nextRole);
    notify({
      type: 'info',
      title: `Vista de ${nextRole} 👤`,
      message: 'Simulando perspectiva para propósitos del demo.',
      icon: 'sync'
    });
  };

  const addSystemMessage = useCallback((text: string, type: 'info' | 'warning' = 'info') => {
    setMessages(prev => [...prev, {
      role: 'sistema',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, []);

  const requestMediation = () => {
    setStatus('DISPUTA');
    addSystemMessage('⚖️ Mediación iniciada. Un representante humano revisará el historial y las evidencias.', 'warning');
    notify({
      type: 'warning',
      title: 'Mediación Solicitada ⚖️',
      message: 'Un mediador se unirá pronto al chat para revisar las evidencias.',
      icon: 'gavel'
    });
  };

  const resolveDispute = (winner: 'COMPRADOR' | 'VENDEDOR') => {
    setStatus('FINALIZADO');
    const message = winner === 'COMPRADOR'
      ? '✅ El mediador ha resuelto a favor del COMPRADOR. El dinero será reembolsado.'
      : '✅ El mediador ha resuelto a favor del VENDEDOR. El dinero ha sido liberado.';
    addSystemMessage(message, 'info');
    notify({
      type: 'success',
      title: 'Disputa Resuelta',
      message,
      icon: 'verified'
    });
  };

  // --- Render Helpers ---
  const renderActionButtons = () => {
    if (status === 'DISPUTA') {
      return (
        <div className="flex flex-col gap-4 w-full">
          <div className="bg-coral-soft/20 p-6 rounded-3xl border-2 border-coral-soft">
            <p className="font-bold text-coral-dark text-center">Trato en mediación. Un representante está analizando la bitácora.</p>
          </div>
          {currentUserRole === 'MEDIADOR' && (
            <div className="flex gap-4 justify-center">
              <button onClick={() => resolveDispute('COMPRADOR')} className="px-6 py-3 bg-white text-dark-charcoal border-2 border-dark-charcoal font-black rounded-full hover:bg-slate-50 transition-all">Reembolsar Comprador</button>
              <button onClick={() => resolveDispute('VENDEDOR')} className="px-6 py-3 bg-menta text-dark-charcoal border-2 border-dark-charcoal font-black rounded-full hover:bg-menta-dark transition-all">Pagar Vendedor</button>
            </div>
          )}
        </div>
      );
    }

    if (status === 'FINALIZADO') {
      return (
        <div className="bg-menta/20 p-6 rounded-3xl border-2 border-menta w-full">
          <p className="font-bold text-menta-dark text-center">¡Trato finalizado con éxito! La felicidad es compartida.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-4 relative z-10">
        {currentUserRole === 'COMPRADOR' && (
          <>
            {status === 'ENVIADO' && (
              <button
                onClick={() => { setStatus('FINALIZADO'); addSystemMessage('🎉 El comprador confirmó la recepción del producto.'); notify({ type: 'success', title: '¡Éxito!', message: 'Dinero liberado al vendedor.', icon: 'celebration' }); }}
                className="px-10 py-5 bg-menta text-dark-charcoal font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex items-center gap-2"
              >
                <span className="material-symbols-outlined">task_alt</span>
                Recibido y Liberar Pago
              </button>
            )}
            <button onClick={requestMediation} className="px-10 py-5 bg-white/10 text-white font-black rounded-full border border-white/20 hover:bg-white/20 transition-all">
              Pedir Mediación
            </button>
          </>
        )}

        {currentUserRole === 'VENDEDOR' && (
          <>
            {status === 'FONDEADO' && (
              <button
                onClick={() => { setStatus('ENVIADO'); setDeadline(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)); addSystemMessage('🚚 El vendedor ha enviado el producto y cargado la evidencia.'); }}
                className="px-10 py-5 bg-sky-soft text-dark-charcoal font-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-[6px_6px_0px_rgba(255,255,255,0.2)] flex items-center gap-2"
              >
                <span className="material-symbols-outlined">local_shipping</span>
                Ya envié el producto
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen">
      {/* Header with Navigation & Role Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-4 bg-white hand-drawn-card hover:bg-menta/10 transition-all active:scale-95">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-4xl font-display font-black text-dark-charcoal">Sistema ESgrow</h1>
            <p className="text-gray-500 font-bold italic">Cultivando confianza para el Trato #{dealData.id}</p>
          </div>
        </div>

        <div className="flex gap-4">
          <select
            value={currentUserRole}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              setCurrentUserRole(newRole);
              notify({ type: 'info', title: `Vista de ${newRole}`, message: 'Perspectiva cambiada.', icon: 'sync' });
            }}
            className="px-6 py-3 bg-white hand-drawn-card text-xs font-black uppercase tracking-widest hover:bg-slate-50 border-2 border-dark-charcoal outline-none cursor-pointer"
          >
            <option value="COMPRADOR">Simular: Comprador</option>
            <option value="VENDEDOR">Simular: Vendedor</option>
            <option value="MEDIADOR">Simular: Mediador</option>
          </select>

          <div className="bg-white hand-drawn-card p-4 flex items-center gap-4 rotate-1 shadow-md border-2 border-dark-charcoal">
            <div className="size-14 rounded-2xl border-2 border-dark-charcoal overflow-hidden shrink-0">
              <img src={dealData.seller.avatar} alt="Seller" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm">{dealData.seller.name}</p>
                <span className="bg-menta text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-dark-charcoal/10">Socio Épico</span>
              </div>
              <div className="flex items-center gap-1 text-coral-soft">
                <span className="material-symbols-outlined text-xs fill-1">verified</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-dark-charcoal/40">{dealData.seller.points} Puntos de Buena Gente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Progress & Visual Trust */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white hand-drawn-card p-10 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-menta/5 organic-border -translate-y-1/2 translate-x-1/2"></div>

            {/* Timer Badge */}
            {(status !== 'FINALIZADO' && status !== 'DISPUTA') && (
              <div className="absolute top-4 left-4 bg-coral-soft text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse border border-white">
                LÍMITE: {timeLeft}
              </div>
            )}

            <h3 className="font-display font-bold text-xl mb-6 mt-4">Salud del Trato</h3>

            <div className="relative size-56 mb-8 flex items-center justify-center">
              <div className={`absolute inset-0 rounded-blob animate-pulse ${status === 'DISPUTA' ? 'bg-coral-soft/20' : 'bg-menta/10'}`}></div>
              <div className="relative z-10 flex flex-col items-center">
                <span className={`material-symbols-outlined text-[100px] select-none animate-bounce-short ${status === 'DISPUTA' ? 'text-coral-soft' : 'text-menta-dark'}`}>
                  {status === 'DISPUTA' ? 'warning' : currentStepIdx < 2 ? 'seed' : currentStepIdx < 4 ? 'spa' : 'park'}
                </span>
                <div className="mt-4 bg-dark-charcoal text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full">
                  {status === 'DISPUTA' ? 'BAJO REVISIÓN' : `Nivel de Confianza: ${Math.round(((currentStepIdx + 1) / steps.length) * 100)}%`}
                </div>
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                <span>Acuerdo</span>
                <span>Éxito</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full p-1 border border-dark-charcoal/10">
                <div className={`h-full rounded-full transition-all duration-1000 ${status === 'DISPUTA' ? 'bg-coral-soft' : 'bg-menta'}`} style={{ width: `${((currentStepIdx + 1) / steps.length) * 100}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-papel paper-texture p-8 hand-drawn-card border-dashed border-dark-charcoal/20">
            <h4 className="font-display font-bold mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-coral-soft">history</span>
              Bitácora de Eventos
            </h4>
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className={`flex items-center gap-4 ${idx > currentStepIdx ? 'opacity-20 grayscale' : ''}`}>
                  <div className={`size-8 rounded-lg flex items-center justify-center border-2 border-dark-charcoal ${idx <= currentStepIdx ? 'bg-menta shadow-sm' : 'bg-white'}`}>
                    <span className="material-symbols-outlined text-sm font-bold">{idx < currentStepIdx ? 'check' : step.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest leading-none">{step.label}</p>
                    <p className="text-[10px] font-medium text-gray-400">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Hub */}
        <div className="lg:col-span-8 space-y-10">

          <section className="bg-white hand-drawn-card overflow-hidden flex flex-col h-[500px] shadow-2xl border-4 border-dark-charcoal relative">
            <div className="bg-dark-charcoal p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-menta">security</span>
                <p className="font-display font-bold">Chat Protegido: {currentUserRole}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadDealChat}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 transition-all border border-white/20"
                >
                  <span className="material-symbols-outlined text-sm">gavel</span>
                  Guardar Bitácora
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col ${m.role === 'sistema' ? 'items-center' : m.role === currentUserRole.toLowerCase() ? 'items-end' : 'items-start'}`}>
                  {m.role === 'sistema' ? (
                    <div className="bg-white/50 px-6 py-2 rounded-full border border-dark-charcoal/10 my-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-dark-charcoal/60">{m.text}</p>
                    </div>
                  ) : (
                    <>
                      <div className={`max-w-[80%] p-4 rounded-3xl border-2 border-dark-charcoal shadow-sm ${m.role === currentUserRole.toLowerCase() ? 'bg-sky-soft rotate-1' : 'bg-white -rotate-1'}`}>
                        <p className="font-handwritten text-xl leading-snug text-dark-charcoal/80">{m.text}</p>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 mt-2 px-2 uppercase">{m.role} • {m.time}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t-4 border-dashed border-dark-charcoal/10 flex gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje seguro..."
                className="flex-1 bg-slate-100 border-2 border-transparent rounded-2xl px-6 py-4 font-handwritten text-xl focus:bg-white focus:border-menta transition-all outline-none"
              />
              <button className="size-16 bg-menta text-dark-charcoal rounded-2xl border-3 border-dark-charcoal flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <span className="material-symbols-outlined text-3xl">send</span>
              </button>
            </form>
          </section>

          <section className="bg-white/40 p-10 rounded-[3rem] border-4 border-dashed border-dark-charcoal/10 relative">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
              <div>
                <h3 className="text-3xl font-display font-black text-dark-charcoal flex items-center gap-3">
                  <span className="material-symbols-outlined text-coral-soft">photo_library</span>
                  Álbum de Recuerdos
                </h3>
              </div>
              <button
                onClick={handleUploadPhoto}
                disabled={isVerifyingAI}
                className="bg-berry text-white px-8 py-4 rounded-full font-black flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                <span className="material-symbols-outlined">{isVerifyingAI ? 'sync' : 'photo_camera'}</span>
                {isVerifyingAI ? 'IA Verificando...' : 'Subir Prueba'}
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-10">
              {evidence.map((img, idx) => (
                <div key={img.id} className={`group relative p-4 bg-white shadow-2xl border-2 border-dark-charcoal rotate-${idx % 2 === 0 ? '[2deg]' : '[-3deg]'} transition-all hover:rotate-0 hover:scale-110`}>
                  <div className="aspect-square size-40 bg-gray-100 overflow-hidden mb-3">
                    <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-handwritten text-sm font-bold text-dark-charcoal/40 italic">{img.type} - {img.user}</p>
                    {img.aiVerified && (
                      <div className="flex items-center gap-1 bg-menta/20 px-2 py-0.5 rounded-full border border-menta/30" title="Verificado por IA">
                        <span className="material-symbols-outlined text-[10px] text-menta-dark font-black">auto_awesome</span>
                        <span className="text-[8px] font-black text-menta-dark uppercase">IA OK</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-8 bg-sky-soft/40 backdrop-blur-sm border border-white/20 rotate-[-5deg]"></div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-dark-charcoal p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="relative z-10">
              <h3 className="text-2xl font-display font-bold mb-2">Cofre del Trato</h3>
              <p className="text-indigo-200 font-medium">El dinero de <span className="text-menta font-black font-display">${dealData.price.toLocaleString()}</span> está blindado.</p>
            </div>
            {renderActionButtons()}
            <div className="absolute -right-10 -bottom-10 size-48 bg-white/5 organic-border rotate-45"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESgrow;
