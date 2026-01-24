
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../App';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

const SupportChat = () => {
  const { notify } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy Capi del equipo de soporte. 👋 Estoy aquí para ayudarte a resolver este bache en el camino. ¿En qué puedo apoyarte con el Trato #TRX-8829?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const downloadChatHistory = () => {
    const header = `--- PRUEBA LEGAL DE SOPORTE - DE OPORTUNIDADES ---\n`;
    const dealInfo = `Trato: #TRX-8829\nFecha de Exportación: ${new Date().toLocaleString()}\n`;
    const separator = `--------------------------------------------------\n\n`;
    
    const chatContent = messages.map(m => {
      const name = m.role === 'user' ? 'USUARIO' : 'CAPI SUPPORT';
      return `[${name}]: ${m.text}\n`;
    }).join('\n');

    const footer = `\n\n--- FIN DEL DOCUMENTO - PROTEGIDO POR SISTEMA ESGROW ---`;
    
    const blob = new Blob([header + dealInfo + separator + chatContent + footer], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prueba_Legal_Soporte_TRX8829_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify({
      type: 'success',
      title: '¡Prueba Legal Descargada! ⚖️',
      message: 'El historial se guardó en tu dispositivo para tu seguridad.',
      icon: 'gavel'
    });
  };

  const sendMessage = async (retryText?: string) => {
    const userMsg = retryText || input.trim();
    if (!userMsg || isTyping) return;

    if (!retryText) {
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setInput('');
    }
    
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `Eres "Capi Support", un agente de soporte amigable, empático y profesional de la plataforma "De Oportunidades". 
          Tu objetivo es mediar en disputas de compra-venta de forma justa. 
          Usa un tono cercano pero resolutivo. No des soluciones legales definitivas, sino que guía al usuario en el proceso de resolución de la plataforma. 
          El usuario está en una disputa por el Trato #TRX-8829 (un monitor dañado). 
          Fomenta la subida de pruebas (fotos) y la comunicación pacífica.`,
        },
      });

      const responseStream = await chat.sendMessageStream({ message: userMsg });
      
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      
      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const chunkText = c.text || '';
        fullResponse += chunkText;
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }

      if (!fullResponse) {
        throw new Error('Empty response from AI');
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorFriendlyMessage = 'Perdón, tuve un pequeño tropezón técnico. ¿Podrías repetirme eso?';
      
      if (error.message?.includes('429')) {
        errorFriendlyMessage = '¡Uf! Estoy atendiendo a muchos aventureros a la vez. Dame un segundito y volvemos a intentar. ⏳';
      } else if (!navigator.onLine) {
        errorFriendlyMessage = 'Parece que tu conexión se fue de viaje. ¡Revisa tu internet y volvemos! 🌐';
      }

      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === 'model' && lastMsg.text === '') {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', text: errorFriendlyMessage, isError: true };
          return updated;
        }
        return [...prev, { role: 'model', text: errorFriendlyMessage, isError: true }];
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] size-16 bg-berry text-white organic-border border-4 border-dark-charcoal shadow-[6px_6px_0px_rgba(16,34,24,1)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
      >
        <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform">
          {isOpen ? 'close' : 'support_agent'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] w-[90vw] max-w-[400px] h-[550px] bg-papel paper-texture hand-drawn-card flex flex-col shadow-2xl animate-bounce-short border-4 border-dark-charcoal">
          <div className="p-4 border-b-4 border-dark-charcoal bg-menta flex items-center gap-3">
            <div className="size-12 bg-white rounded-blob border-2 border-dark-charcoal overflow-hidden p-1 shadow-sm">
              <img src="https://picsum.photos/100/100?avatar" alt="Capi" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="font-display font-bold text-lg leading-tight text-dark-charcoal">Capi Support</p>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 bg-emerald-500 rounded-full animate-pulse border border-dark-charcoal/20"></div>
                <p className="text-[10px] font-black uppercase text-dark-charcoal/60 tracking-wider">Listo para ayudar</p>
              </div>
            </div>
            
            <button 
              onClick={downloadChatHistory}
              title="Guardar chat como prueba legal"
              className="p-2 hover:bg-white/20 rounded-lg text-dark-charcoal transition-colors group relative"
            >
              <span className="material-symbols-outlined font-bold">gavel</span>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark-charcoal text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Descargar Prueba Legal
              </div>
            </button>
            
            <button onClick={() => setIsOpen(false)} className="text-dark-charcoal/40 hover:text-dark-charcoal">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-hide"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl border-2 border-dark-charcoal shadow-sm font-handwritten text-xl leading-snug transition-all ${
                  m.role === 'user' ? 'bg-sky-soft rotate-1 self-end' : 
                  m.isError ? 'bg-coral-soft/20 border-coral-soft text-red-900 -rotate-1' : 'bg-white -rotate-1 self-start'
                }`}>
                  {m.isError && <span className="material-symbols-outlined text-sm mr-1 align-middle">error</span>}
                  {m.text || (isTyping && i === messages.length - 1 ? '...' : '')}
                </div>
                {m.isError && (
                   <button 
                    onClick={() => {
                      const lastUserMsg = [...messages].reverse().find(msg => msg.role === 'user');
                      if (lastUserMsg) sendMessage(lastUserMsg.text);
                    }}
                    className="mt-2 text-[10px] font-black uppercase text-coral-soft hover:underline flex items-center gap-1 ml-1"
                   >
                     <span className="material-symbols-outlined text-xs">refresh</span>
                     Reintentar mensaje
                   </button>
                )}
              </div>
            ))}
            {isTyping && messages[messages.length-1].text === '' && (
              <div className="flex justify-start">
                <div className="bg-white/80 p-3 rounded-2xl border-2 border-dashed border-dark-charcoal/30 animate-pulse shadow-sm">
                  <span className="text-xs font-bold italic text-dark-charcoal/50">Capi está escribiendo...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t-4 border-dark-charcoal bg-white/50 backdrop-blur-sm">
            <div className="relative flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Pregunta lo que quieras..."
                disabled={isTyping}
                className="flex-1 py-4 px-5 rounded-2xl border-3 border-dark-charcoal font-handwritten text-xl focus:ring-0 focus:border-berry transition-colors disabled:opacity-50 bg-white shadow-inner"
              />
              <button 
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="size-14 bg-menta text-dark-charcoal border-3 border-dark-charcoal rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-[4px_4px_0px_rgba(16,34,24,1)]"
              >
                <span className="material-symbols-outlined text-3xl">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ProgressStepper = () => {
  const steps = [
    { label: 'Pactado', icon: 'handshake', status: 'completed' },
    { label: 'Pagado', icon: 'account_balance_wallet', status: 'completed' },
    { label: 'Enviado', icon: 'local_shipping', status: 'completed' },
    { label: 'Recepción', icon: 'package_2', status: 'current' },
    { label: 'Finalizado', icon: 'task_alt', status: 'upcoming' },
  ];

  return (
    <div className="w-full py-8 mb-8">
      <div className="flex items-center justify-between relative max-w-3xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full">
          <div className="absolute top-0 left-0 h-full bg-menta transition-all duration-1000 rounded-full shadow-[0_0_10px_rgba(64,247,171,0.5)]" style={{ width: '75%' }}></div>
        </div>

        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isUpcoming = step.status === 'upcoming';

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center group">
              <div className={`
                size-14 rounded-blob border-3 border-dark-charcoal flex items-center justify-center transition-all duration-500 shadow-sm
                ${isCompleted ? 'bg-menta text-dark-charcoal' : ''}
                ${isCurrent ? 'bg-coral-soft text-dark-charcoal scale-125 ring-8 ring-coral-soft/20 rotate-12 shadow-md' : ''}
                ${isUpcoming ? 'bg-white text-slate-300' : ''}
              `}>
                <span className="material-symbols-outlined text-2xl font-bold">
                  {isCompleted ? 'check' : step.icon}
                </span>
              </div>
              <div className={`
                absolute -bottom-10 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors
                ${isCompleted ? 'text-menta-dark' : ''}
                ${isCurrent ? 'text-coral-soft' : ''}
                ${isUpcoming ? 'text-slate-300' : ''}
              `}>
                {step.label}
              </div>
              {isCurrent && (
                <div className="absolute -top-12 bg-coral-soft text-dark-charcoal text-[10px] font-black px-4 py-1.5 rounded-full border-2 border-dark-charcoal animate-bounce shadow-md">
                  ¡ACTUAL!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dispute = () => {
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [showCancelModal, setShowCancelModal] = useState(false);

  const simulateDispute = () => {
    notify({
      type: 'error',
      title: '¡Disputa Iniciada! ⚠️',
      message: 'Se ha abierto una mediación para el Trato #TRX-8829. Por favor, sube tus pruebas lo antes posible.',
      icon: 'warning'
    });
  };

  const handleCancelDeal = () => {
    setShowCancelModal(false);
    notify({
      type: 'info',
      title: 'Trato Cancelado 🕊️',
      message: 'El trato ha sido cancelado con éxito. El dinero será devuelto al comprador en breve.',
      icon: 'cancel'
    });
    setTimeout(() => navigate('/dashboard'), 1500);
  };

  return (
    <div className="max-w-[1100px] mx-auto py-10 px-4 md:px-10 relative">
      <div className="mb-8">
        <div className="bg-sky-soft/30 hand-drawn-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 rotate-[-0.5deg] border-4 border-dark-charcoal shadow-[8px_8px_0px_rgba(16,34,24,0.1)]">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="size-24 rounded-blob border-4 border-dark-charcoal overflow-hidden rotate-[-3deg] shadow-xl bg-white">
                <img src="https://picsum.photos/400/400?person=1" alt="Vendedor" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-menta text-dark-charcoal p-1.5 rounded-full border-2 border-dark-charcoal shadow-sm">
                <span className="material-symbols-outlined text-sm font-black">verified</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-dark-charcoal/40 uppercase tracking-widest mb-1">Tu Contraparte</p>
              <h2 className="text-4xl font-black font-display text-dark-charcoal leading-none">Juan Pérez</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="bg-menta/40 px-3 py-1 rounded-full text-[10px] font-black uppercase text-menta-dark border border-menta-dark/30">98% Palabra</span>
                <span className="text-dark-charcoal/30 text-[10px] font-bold uppercase tracking-widest">• Trato #TRX-8829</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
             <button className="px-6 py-4 bg-white hand-drawn-card text-sm font-bold hover:bg-papel transition-colors flex items-center gap-2 border-3 border-dark-charcoal shadow-[4px_4px_0px_rgba(0,0,0,1)]">
               <span className="material-symbols-outlined text-lg">person</span>
               Perfil
             </button>
             <button className="px-6 py-4 bg-berry text-white hand-drawn-card text-sm font-bold hover:brightness-110 transition-all flex items-center gap-2 border-3 border-dark-charcoal shadow-[4px_4px_0_rgba(0,0,0,1)]">
               <span className="material-symbols-outlined text-lg">chat</span>
               Chat
             </button>
          </div>
        </div>
      </div>

      <ProgressStepper />

      <div className="relative text-center py-8 mb-12 border-b-4 border-dashed border-dark-charcoal/5">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-coral-soft text-dark-charcoal text-[10px] font-black px-6 py-2 rounded-full border-2 border-dark-charcoal rotate-2 shadow-sm">
          RESOLUCIÓN EN PROGRESO
        </div>
        <button 
          onClick={simulateDispute}
          className="absolute right-0 top-0 text-[10px] uppercase font-black px-4 py-2 bg-coral-soft/20 text-coral-soft border-2 border-coral-soft/20 rounded-full hover:bg-coral-soft/40 transition-all">
          Simular Alerta
        </button>
        <h1 className="text-5xl md:text-6xl font-display font-black text-dark-charcoal mb-3 mt-4">Detalles del Trato</h1>
        <p className="font-handwritten text-3xl text-dark-charcoal/60 italic">iPhone 13 Pro Max — Protegido por Escrow</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4 relative py-4">
          <h3 className="text-2xl font-display font-bold mb-10 flex items-center gap-3">
            <span className="material-symbols-outlined text-coral-soft">map</span>
            Historia del Trato
          </h3>
          <div className="relative ml-5 space-y-12">
            <div className="absolute left-[23px] top-6 bottom-6 w-1.5 bg-slate-100 border-l-2 border-dashed border-dark-charcoal/10"></div>
            {[
              { status: 'Pago Recibido', note: '12 Oct • El tesoro está a salvo', icon: 'favorite', bg: 'bg-menta' },
              { status: 'Producto Enviado', note: '14 Oct • El paquete va en camino', icon: 'local_shipping', bg: 'bg-sky-soft' },
              { status: 'Bache en el camino', note: '¡Oh no! Llegó dañado.', icon: 'sentiment_dissatisfied', bg: 'bg-coral-soft', current: true },
              { status: 'Resolución Final', note: 'Esperando veredicto...', icon: 'auto_fix_high', bg: 'bg-slate-50', ghost: true }
            ].map((step, i) => (
              <div key={i} className={`relative flex gap-8 items-start ${step.ghost ? 'opacity-40' : ''}`}>
                <div className={`size-12 rounded-blob flex items-center justify-center border-3 border-dark-charcoal shadow-md ${step.bg} text-dark-charcoal ${step.current ? 'scale-110 ring-4 ring-coral-soft/30' : ''}`}>
                  <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                </div>
                <div className={step.current ? 'bg-coral-soft/10 p-4 rounded-2xl border-2 border-dark-charcoal border-dashed' : ''}>
                  <p className="font-black text-sm uppercase tracking-widest leading-none">{step.status}</p>
                  <p className={`font-handwritten text-xl ${step.current ? 'mt-2 italic text-dark-charcoal' : 'text-dark-charcoal/50'}`}>{step.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-12">
          <div className="space-y-8">
            <h2 className="text-3xl font-display font-bold flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-coral-soft">forum</span>
              Notas Compartidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
              <div className="bg-papel paper-texture p-8 hand-drawn-card border-3 border-dark-charcoal min-h-[200px] rotate-[-1deg] shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-coral-soft">person</span>
                  <span className="font-display font-bold text-lg">Tu Nota</span>
                </div>
                <p className="font-handwritten text-2xl leading-relaxed text-dark-charcoal/80">
                  "El monitor llegó con la pantalla estallada... ¡parece una telaraña en la esquina! La caja se veía golpeada."
                </p>
              </div>
              <div className="bg-sky-soft/40 p-8 hand-drawn-card border-3 border-dark-charcoal min-h-[200px] rotate-[1.5deg] shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-sky-soft bg-dark-charcoal rounded-full p-0.5 scale-75">storefront</span>
                  <span className="font-display font-bold text-lg">Nota de Juan</span>
                </div>
                <p className="font-handwritten text-2xl leading-relaxed text-dark-charcoal/80">
                  "¡Le puse burbujas extra! Salió de casa perfecto. Debe haber sido el transporte. Busquemos solución."
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/40 p-10 rounded-[48px] border-4 border-dashed border-dark-charcoal/10 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
              <h3 className="text-3xl font-display font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-berry">photo_library</span>
                Álbum de Pruebas
              </h3>
              <button className="font-display font-bold text-lg text-coral-soft hover:scale-110 transition-transform flex items-center gap-2 bg-white px-6 py-3 rounded-full border-2 border-coral-soft/20 shadow-sm">
                <span className="material-symbols-outlined">add_circle</span>
                Pegar Foto
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">
              {[1, 2, 3].map(i => (
                <div key={i} className={`p-4 bg-white shadow-xl rotate-${i % 2 === 0 ? '3' : '[-3]'} transition-all hover:rotate-0 border-2 border-dark-charcoal hover:scale-105 cursor-pointer`}>
                  <div className="aspect-square bg-cover bg-center rounded-sm mb-3 border border-dark-charcoal/5" style={{ backgroundImage: `url('https://picsum.photos/400/400?evidence=${i}')` }}></div>
                  <p className="text-center font-handwritten text-lg text-dark-charcoal/40 italic">Evidencia #{i}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-10 items-center p-12 bg-white hand-drawn-card border-4 border-dark-charcoal shadow-[12px_12px_0px_rgba(16,34,24,1)]">
            <div className="text-center">
              <p className="font-display text-3xl font-bold mb-2">¿Cómo cerramos este capítulo?</p>
              <p className="font-handwritten text-2xl text-dark-charcoal/50">Tu decisión es clave para liberar el cofre.</p>
            </div>
            <div className="flex flex-col w-full gap-6">
              <div className="flex flex-wrap justify-center gap-6 w-full">
                <button className="flex-1 min-w-[240px] py-6 rounded-blob bg-coral-soft text-dark-charcoal font-black text-xl hover:brightness-105 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none border-3 border-dark-charcoal flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined font-black">undo</span>
                  Aceptar Reembolso
                </button>
                <button className="flex-1 min-w-[240px] py-6 rounded-blob bg-sky-soft text-dark-charcoal font-black text-xl hover:brightness-105 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none border-3 border-dark-charcoal flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined font-black">support_agent</span>
                  Mediación Extra
                </button>
              </div>
              <div className="flex justify-center mt-4">
                <button 
                  onClick={() => setShowCancelModal(true)}
                  className="text-dark-charcoal/40 font-bold hover:text-coral-soft transition-colors text-xs uppercase tracking-widest underline underline-offset-8 decoration-dashed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  Cancelar Trato Completo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark-charcoal/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-papel paper-texture hand-drawn-card p-12 max-w-md w-full text-center rotate-[-1deg] animate-bounce-short border-4 border-dark-charcoal shadow-2xl">
            <div className="size-24 bg-coral-soft text-dark-charcoal rounded-blob border-4 border-dark-charcoal mx-auto mb-8 flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-6xl font-black">warning</span>
            </div>
            <h3 className="text-4xl font-black font-display mb-4 text-dark-charcoal">¿Estás seguro? 🥺</h3>
            <p className="font-handwritten text-2xl text-dark-charcoal/60 mb-10 leading-relaxed italic">
              Si cancelas, el proceso se detiene y el dinero volverá a su origen. ¡Piénsalo bien, aventurero!
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-5 bg-white text-dark-charcoal font-black rounded-full border-3 border-dark-charcoal hover:bg-slate-50 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                Volver
              </button>
              <button 
                onClick={handleCancelDeal}
                className="flex-1 py-5 bg-coral-soft text-dark-charcoal font-black rounded-full border-3 border-dark-charcoal shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <SupportChat />
    </div>
  );
};

export default Dispute;
