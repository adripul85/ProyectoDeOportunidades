
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../App';
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
    { role: 'model', text: 'Bienvenido al Centro de Resolución. Soy tu asistente de mediación. ¿Cómo puedo ayudarte respecto al Trato #TRX-8829?' }
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
    const header = `--- REGISTRO DE MEDIACIÓN OFICIAL - DE OPORTUNIDADES 🎯 ---\n`;
    const dealInfo = `Transacción: #TRX-8829\nFecha: ${new Date().toLocaleString()}\n`;
    const separator = `--------------------------------------------------\n\n`;

    const chatContent = messages.map(m => {
      const name = m.role === 'user' ? 'USUARIO' : 'MEDIADOR IA';
      return `[${name}]: ${m.text}\n`;
    }).join('\n');

    const footer = `\n\n--- FIN DEL REGISTRO ---\nEste documento constituye evidencia válida para procesos de resolución.`;

    const blob = new Blob([header + dealInfo + separator + chatContent + footer], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Mediation_Log_TRX8829_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify({
      type: 'info',
      title: 'Registro Descargado',
      message: 'El historial de mediación ha sido guardado exitosamente.',
      icon: 'description'
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const chat = ai.chats.create({
        model: 'gemini-2.0-flash-exp',
        config: {
          systemInstruction: `Eres un Mediador Profesional para la plataforma "De Oportunidades 🎯".
          Tu objetivo es resolver disputas de manera imparcial, técnica y eficiente.
          Tono: Profesional, neutral y decisivo. Evita el uso excesivo de emojis.
          Contexto: Trato #TRX-8829 (monitor dañado en tránsito).
          Prioridad: Solicitar evidencia objetiva y citar políticas de protección al comprador.
          Tu respuesta DEBE estar en ESPAÑOL.`,
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
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'model', text: 'Error de protocolo. Por favor reintenta.', isError: true }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-10 right-10 z-[60] size-16 bg-dark-800 text-white rounded-full shadow-premium hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-white/10"
      >
        <span className="material-symbols-outlined text-3xl">
          {isOpen ? 'close' : 'support_agent'}
        </span>
      </button>

      {isOpen && (
        <div className="fixed bottom-28 right-10 z-[60] w-[90vw] max-w-[440px] h-[650px] bg-white rounded-[40px] flex flex-col shadow-premium border border-light-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 border-b border-light-100 bg-light-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-dark-800 text-red-600 rounded-2xl flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-2xl font-black">shield_lock</span>
              </div>
              <div>
                <p className="font-black text-xs text-dark-800 uppercase tracking-widest leading-none">Vínculo de Mediación</p>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 mt-2">Conexión Asegurada</p>
              </div>
            </div>

            <button onClick={downloadChatHistory} className="size-10 bg-white border border-light-200 rounded-xl text-gray-400 hover:text-dark-800 transition-colors flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-xl">description</span>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-light-50/20">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-5 rounded-3xl shadow-sm text-sm font-bold leading-relaxed max-w-[85%] ${m.role === 'user' ? 'bg-dark-800 text-white rounded-tr-none' :
                  'bg-white text-dark-800 border border-light-100 rounded-tl-none'
                  }`}>
                  {m.text || '...'}
                </div>
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mt-3 px-2">
                  {m.role === 'user' ? 'Usuario Autenticado' : 'Mediador Neutral IA'}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 px-2">
                <div className="size-1.5 bg-red-600 rounded-full animate-bounce"></div>
                <div className="size-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="size-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="p-6 bg-white border-t border-light-100 flex gap-4"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Detalla tu situación..."
              disabled={isTyping}
              className="flex-1 bg-light-50 border border-transparent rounded-[24px] px-6 py-4 text-xs font-black text-dark-800 placeholder:text-gray-300 focus:bg-white focus:border-primary-100 transition-all outline-none"
            />
            <button
              disabled={!input.trim() || isTyping}
              className="size-14 bg-red-600 text-white rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary-500/10 active:scale-90 disabled:opacity-30 flex items-center justify-center"
            >
              <span className="material-symbols-outlined font-black">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

const ProgressStepper = () => {
  const steps = [
    { label: 'Acordado', icon: 'handshake', status: 'completed' },
    { label: 'Pagado', icon: 'shield_lock', status: 'completed' },
    { label: 'Enviado', icon: 'local_shipping', status: 'completed' },
    { label: 'Mediación', icon: 'gavel', status: 'current' },
    { label: 'Resolución', icon: 'task_alt', status: 'upcoming' },
  ];

  return (
    <div className="w-full py-16 px-6">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-light-200 -translate-y-1/2 z-0"></div>

        {steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <div className={`
                size-12 rounded-[18px] flex items-center justify-center transition-all duration-700 border-2
                ${isCompleted ? 'bg-dark-800 border-dark-800 text-white' : ''}
                ${isCurrent ? 'bg-white border-red-600 text-red-600 ring-8 ring-primary-50' : ''}
                ${step.status === 'upcoming' ? 'bg-light-50 border-light-200 text-gray-200' : ''}
              `}>
                <span className="material-symbols-outlined text-base font-black">
                  {isCompleted ? 'check' : step.icon}
                </span>
              </div>
              <span className={`
                absolute -bottom-10 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap
                ${isCurrent ? 'text-red-600' : 'text-gray-300'}
              `}>
                {step.label}
              </span>
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

  return (
    <main className="max-w-7xl mx-auto px-6 py-16 bg-light-50 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* Header Section */}
        <div className="lg:col-span-12">
          <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="size-24 rounded-[32px] bg-light-100 overflow-hidden border border-light-200 shadow-inner group">
                <img src="https://picsum.photos/400/400?person=1" alt="Counterparty" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2">Contraparte del Trato</p>
                <h2 className="text-3xl font-black text-dark-800 tracking-tight">Juan Pérez</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className="bg-primary-50 text-red-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary-100">Identidad Verificada</span>
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">• Protocolo #TRX-8829</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-white text-dark-800 border-2 border-light-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-light-50 transition-all active:scale-95">Ver Perfil</button>
              <button className="px-8 py-4 bg-dark-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-dark-800/10 active:scale-95">Mensaje Directo</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12">
          <ProgressStepper />
        </div>

        {/* Resolution Content */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-10 ml-2">Cronología del Incidente</h3>
            <div className="space-y-10 relative ml-4">
              <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-light-100"></div>
              {[
                { title: 'Pago Asegurado', date: 'Oct 12, 14:20', icon: 'verified', active: false },
                { title: 'Logística Despachada', date: 'Oct 14, 09:15', icon: 'local_shipping', active: false },
                { title: 'Mediación Activada', date: 'Oct 16, 11:45', icon: 'gavel', active: true },
                { title: 'Resolución Pendiente', date: '-', icon: 'pending', active: false, opacity: true }
              ].map((step, i) => (
                <div key={i} className={`relative flex gap-8 items-start ${step.opacity ? 'opacity-20' : ''}`}>
                  <div className={`size-6 rounded-lg flex items-center justify-center border-2 transition-all z-10 ${step.active ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-white border-light-200 text-gray-200'}`}>
                    <span className="material-symbols-outlined text-[10px] font-black">{step.icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-dark-800 uppercase tracking-widest">{step.title}</p>
                    <p className="text-[9px] font-bold text-gray-300 mt-1 uppercase tracking-tighter">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-dark-800 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-32 bg-red-600/20 blur-[60px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="flex items-center gap-4 mb-8">
              <span className="material-symbols-outlined text-red-600 font-black">shield_with_heart</span>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">Garantía (Escrow) Activa</h3>
            </div>
            <p className="text-[11px] font-medium text-gray-400 leading-relaxed italic relative z-10">
              "El capital de $125,000.00 ha sido congelado en el libro contable seguro. La liberación solo ocurrirá tras la resolución del protocolo."
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-12">
          {/* Notes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-red-600 text-base font-black">person</span>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Tu Alegación</p>
              </div>
              <p className="text-sm font-bold text-dark-800 leading-relaxed">
                The asset arrived with critical LCD panel damage. External logistics casing showed unauthorized tampering.
              </p>
            </div>
            <div className="bg-light-100/50 p-10 rounded-[40px] border border-transparent">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-gray-300 text-base font-black">storefront</span>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Alegación de Juan</p>
              </div>
              <p className="text-sm font-bold text-gray-400 leading-relaxed italic">
                The product was dispatched in flawless condition with military-grade impact protection.
              </p>
            </div>
          </div>

          {/* Evidence Grid */}
          <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Bóveda de Evidencia</h3>
              <button className="text-[10px] font-black text-red-600 flex items-center gap-2 uppercase tracking-widest hover:underline group">
                <span className="material-symbols-outlined text-base font-black group-hover:rotate-90 transition-transform">add_circle</span>
                Cargar Archivos
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-[24px] bg-light-50 border border-light-100 overflow-hidden hover:scale-105 transition-all cursor-pointer shadow-sm group">
                  <img src={`https://picsum.photos/400/400?evidence=${i}`} alt="doc" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
              ))}
              <div className="aspect-square rounded-[24px] border-2 border-dashed border-light-200 flex flex-col items-center justify-center text-gray-200 hover:border-red-600/30 hover:bg-primary-50 transition-all cursor-pointer group">
                <span className="material-symbols-outlined text-3xl font-black group-hover:scale-110 transition-transform">add</span>
              </div>
            </div>
          </div>

          {/* Action Center */}
          <div className="bg-dark-800 p-12 rounded-[50px] shadow-premium text-center flex flex-col items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
            <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight relative z-10">Terminal de Resolución</h3>
            <p className="text-[9px] font-black text-red-600 uppercase tracking-[0.4em] mb-12 relative z-10">Slecciona la ruta del protocolo para avanzar en la mediación</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full relative z-10">
              <button className="p-6 bg-white text-dark-800 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95 group">
                Aceptar Liquidación Parcial
              </button>
              <button className="p-6 bg-dark-700 border border-white/5 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-dark-800 transition-all active:scale-95">
                Escalar a Árbitro Humano
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="col-span-full mt-6 text-[9px] font-black text-red-400 uppercase tracking-[0.4em] hover:text-red-300 transition-colors"
              >
                Solicitar Anulación Absoluta de la Transacción
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-dark-800/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white p-12 rounded-[60px] max-w-md w-full text-center border border-light-200 shadow-2xl scale-in-center">
            <div className="size-20 bg-red-50 text-red-500 rounded-[32px] mx-auto mb-8 flex items-center justify-center border border-red-100/50 shadow-sm animate-pulse">
              <span className="material-symbols-outlined text-4xl font-black">emergency_home</span>
            </div>
            <h3 className="text-3xl font-black text-dark-800 mb-4 uppercase tracking-tight">¿Confirmar Anulación?</h3>
            <p className="text-sm font-bold text-gray-400 mb-12 leading-relaxed px-4">
              Este protocolo revertirá todos los activos al comprador y terminará este registro. La anulación es terminal e irreversible.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-5 bg-light-50 text-dark-800 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] hover:bg-light-100 transition-all"
              >
                Abortar
              </button>
              <button
                className="flex-1 py-5 bg-red-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}

      <SupportChat />
    </main>
  );
};

export default Dispute;
