
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || { title: 'Trato Especial', total: 150000, sellerName: 'Juan Pérez' };
  const ticketNum = Math.floor(Math.random() * 90000000) + 10000000;

  return (
    <main className="flex-grow flex flex-col items-center py-12 px-4 celebration-bg min-h-[80vh]">
      <div className="max-w-[850px] w-full flex flex-col items-center">
        
        {/* Header de Celebración */}
        <div className="relative mb-8 text-center">
          <div className="relative z-10 size-48 flex items-center justify-center mx-auto mb-4 bg-white rounded-full border-8 border-dashed border-coral-soft/40 p-4 shadow-xl">
            <span className="material-symbols-outlined !text-[120px] text-coral-soft rotate-[15deg] select-none">emoji_symbols</span>
            <div className="absolute -top-4 -right-4 size-16 bg-accent-yellow rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg animate-bounce">
              <span className="material-symbols-outlined font-bold text-dark-charcoal">star</span>
            </div>
            <div className="absolute -bottom-2 -left-6 size-12 bg-menta rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
              <span className="material-symbols-outlined font-bold text-dark-charcoal">thumb_up</span>
            </div>
          </div>
          <h1 className="text-coral-soft font-display text-5xl md:text-6xl font-bold leading-none mb-3">¡YAY! ¡Todo Salió Genial!</h1>
          <p className="text-xl font-bold text-gray-500 font-display italic">¡Tu trato ya está blindado y asegurado! ¡A celebrar!</p>
        </div>

        {/* Bitácora de la Operación (Pergamino) */}
        <div className="w-full max-w-2xl mb-16 transform rotate-1">
          <div className="parchment p-10 relative border-l-8 border-[#e6dec3] shadow-2xl">
            <div className="absolute top-4 right-6 opacity-20 rotate-12">
              <span className="material-symbols-outlined !text-7xl">verified_user</span>
            </div>
            <h3 className="font-display text-3xl text-gray-700 font-bold mb-6 underline decoration-dashed decoration-coral-soft/50 underline-offset-8">
              Bitácora de la Operación
            </h3>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="size-24 rounded-2xl border-4 border-coral-soft/30 overflow-hidden shrink-0 rotate-[-3deg] shadow-md">
                <img alt="Trato" className="w-full h-full object-cover" src="https://picsum.photos/400/400?deal=success" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 w-full">
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Ticket Nro.</p>
                  <p className="text-2xl font-display font-bold text-gray-800">#DT-{ticketNum}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Tesoro Total</p>
                  <p className="text-2xl font-display font-bold text-menta-dark">${state.total.toLocaleString()}</p>
                </div>
                <div className="flex flex-col">
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Compa de Trato</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="size-8 rounded-full border-2 border-coral-soft bg-cover" style={{ backgroundImage: "url('https://picsum.photos/100/100?avatar=seller')" }}></div>
                    <p className="text-lg font-bold font-display text-gray-800">{state.sellerName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Estado Actual</p>
                  <span className="bg-menta text-dark-charcoal px-3 py-1 rounded-full font-black text-xs inline-block mt-1 transform -skew-x-6 border border-dark-charcoal/10">
                    ¡FONDEADO!
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ¿Y ahora qué sigue? */}
        <div className="w-full mb-16 px-4">
          <h2 className="text-center font-display text-4xl text-gray-800 font-bold mb-12">¿Y ahora qué sigue? 🤔</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            <div className="flex flex-col items-center">
              <div className="speech-bubble mb-6 transform hover:scale-105 transition-transform shadow-lg" style={{ borderColor: '#40F7AB' }}>
                <p className="text-center font-bold text-gray-700 leading-snug italic font-handwritten text-xl">
                  "¡Psst! El vendedor ya recibió el aviso y está armando tu paquete con mucho amor."
                </p>
              </div>
              <div className="size-14 bg-menta text-dark-charcoal rounded-full flex items-center justify-center shadow-lg hand-drawn-border">
                <span className="material-symbols-outlined">local_post_office</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="speech-bubble mb-6 !border-coral-soft transform -rotate-2 hover:scale-105 transition-transform shadow-lg" style={{ borderColor: '#FF7F6E' }}>
                <p className="text-center font-bold text-gray-700 leading-snug italic font-handwritten text-xl">
                  "Tu dinero está durmiendo tranquilo en nuestra Bóveda de Cristal. ¡Nadie lo toca hasta que digas OK!"
                </p>
              </div>
              <div className="size-14 bg-coral-soft text-dark-charcoal rounded-full flex items-center justify-center shadow-lg hand-drawn-border">
                <span className="material-symbols-outlined">lock_open</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="speech-bubble mb-6 !border-accent-yellow transform rotate-1 hover:scale-105 transition-transform shadow-lg" style={{ borderColor: '#FFD166' }}>
                <p className="text-center font-bold text-gray-700 leading-snug italic font-handwritten text-xl">
                  "¡Dale un saludito! Ya podés chatear para coordinar los detalles finales de la entrega."
                </p>
              </div>
              <div className="size-14 bg-accent-yellow text-dark-charcoal rounded-full flex items-center justify-center shadow-lg hand-drawn-border">
                <span className="material-symbols-outlined">chat_bubble</span>
              </div>
            </div>

          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center mt-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex h-16 items-center justify-center rounded-full px-10 bg-coral-soft text-dark-charcoal text-xl font-black shadow-[0_8px_0_rgb(16,34,24)] hover:shadow-[0_4px_0_rgb(16,34,24)] hover:translate-y-1 transition-all active:shadow-none active:translate-y-2 min-w-[240px] border-2 border-dark-charcoal"
          >
            <span className="material-symbols-outlined mr-3 text-3xl font-black">rocket_launch</span>
            ¡Ir al Tablero!
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="flex h-16 items-center justify-center rounded-full px-10 bg-white border-4 border-dashed border-menta text-menta-dark text-xl font-black hover:bg-menta/10 transition-all min-w-[240px]"
          >
            Volver a la Vidriera
          </button>
        </div>

        <div className="mt-20 flex flex-col items-center gap-3 text-gray-400">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-coral-soft">emoji_objects</span>
            <p className="font-bold">¿Tienes dudas? ¡No te preocupes!</p>
          </div>
          <Link to="/dispute" className="text-menta-dark font-black text-lg hover:underline decoration-wavy">Visita nuestro rincón de ayuda 🎈</Link>
        </div>
      </div>
    </main>
  );
};

export default Success;
