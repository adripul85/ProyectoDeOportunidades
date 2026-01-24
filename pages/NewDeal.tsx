
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../App';

const NewDeal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  
  const state = location.state || {};
  const seller = { 
    sellerName: state.sellerName || 'Vendedor Misterioso', 
    sellerAvatar: state.sellerAvatar || 'https://picsum.photos/400/400?person=99',
    productTitle: state.productTitle || '',
    productPrice: state.productPrice || ''
  };

  const [title, setTitle] = useState(seller.productTitle);
  const [amount, setAmount] = useState(seller.productPrice.toString());
  const [description, setDescription] = useState('');

  // El precio está fijo solo si viene desde una página de producto (el vendedor ya lo puso)
  const isPriceFixed = !!seller.productPrice;

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      notify({
        type: 'warning',
        title: '¡Faltan detalles! 📝',
        message: 'Por favor, dime qué estás pactando y por cuánto dinero.',
        icon: 'edit_square'
      });
      return;
    }

    notify({
      type: 'info',
      title: '¡Trato Preparado! 🚀',
      message: `Estamos configurando tu cofre de seguridad para "${title}".`,
      icon: 'verified'
    });

    setTimeout(() => {
      navigate('/checkout', { state: { title, amount, sellerName: seller.sellerName } });
    }, 1000);
  };

  return (
    <div className="max-w-[800px] mx-auto w-full px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-block bg-sky-soft/30 px-4 py-1 rounded-full hand-drawn-border mb-4 rotate-[-1deg]">
          <span className="text-sm font-black uppercase tracking-widest text-blue-600">Nueva Aventura</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-display mb-4">Creando un Trato Seguro ✨</h1>
        <p className="font-handwritten text-2xl text-gray-500">La confianza es la base de todo gran negocio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Mascot / Advice Section */}
        <div className="md:col-span-4 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="speech-bubble p-6 shadow-xl mb-6 -rotate-2 bg-white border-2 border-dark-charcoal rounded-2xl">
              <p className="font-handwritten text-lg leading-tight text-dark-charcoal">
                {isPriceFixed 
                  ? `"¡Genial! El vendedor ya puso el precio. Solo revisa que todo esté en orden antes de seguir."`
                  : `"¡Ey! Asegúrate de describir bien el producto. Las palabras claras mantienen las amistades largas."`}
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-32 h-32 bg-mint-soft rounded-full flex items-center justify-center hand-drawn-border overflow-hidden rotate-6 shadow-lg border-4 border-white">
                <img src="https://picsum.photos/200/200?avatar=capi" alt="Capi" className="w-24 h-24" />
              </div>
            </div>
          </div>
          
          {isPriceFixed && (
            <div className="bg-menta/10 p-4 rounded-2xl border-2 border-dashed border-menta text-center rotate-[-2deg]">
              <span className="material-symbols-outlined text-menta-dark block mb-1">security</span>
              <p className="text-[10px] font-black uppercase text-menta-dark tracking-tighter">Precio Protegido</p>
            </div>
          )}
        </div>

        {/* Form Section */}
        <form onSubmit={handleCreateDeal} className="md:col-span-8 bg-white hand-drawn-card p-8 md:p-10 rotate-[0.5deg]">
          <div className="flex items-center gap-4 mb-10 pb-6 border-b-2 border-dashed border-gray-100">
            <div className="w-16 h-16 rounded-2xl border-2 border-dark-charcoal overflow-hidden rotate-[-3deg] bg-papel">
              <img src={seller.sellerAvatar} alt="Seller" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Trato con</p>
              <h3 className="text-2xl font-bold font-display leading-tight">{seller.sellerName}</h3>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">¿Qué estás pactando?</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={isPriceFixed}
                placeholder="Ej: Monitor Gamer 144Hz, Clases de Piano..."
                className={`w-full px-6 py-4 rounded-2xl border-3 border-dark-charcoal font-handwritten text-xl focus:ring-4 focus:ring-sky-soft/50 focus:border-berry transition-all bg-white ${isPriceFixed ? 'bg-slate-50 cursor-not-allowed opacity-80' : ''}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 ml-2">
                <label className="block text-sm font-black uppercase tracking-widest text-gray-400">Precio de la magia</label>
                {isPriceFixed && (
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    Fijado por vendedor
                  </span>
                )}
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  readOnly={isPriceFixed}
                  placeholder="0.00"
                  className={`w-full pl-12 pr-6 py-4 rounded-2xl border-3 border-dark-charcoal font-handwritten text-xl focus:ring-4 focus:ring-mint-soft/50 focus:border-berry transition-all bg-white ${isPriceFixed ? 'bg-slate-50 cursor-not-allowed text-dark-charcoal/60' : ''}`}
                />
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-dark-charcoal/30 font-handwritten">$</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-3 ml-2">Detalles del pacto (Opcional)</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Escribe aquí cualquier detalle extra sobre el estado, envío o condiciones..."
                className="w-full px-6 py-4 rounded-2xl border-3 border-dark-charcoal font-handwritten text-xl focus:ring-4 focus:ring-coral-soft/50 focus:border-berry transition-all bg-white resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-coral-soft text-dark-charcoal text-xl font-black rounded-full hand-drawn-border shadow-[6px_6px_0px_rgba(68,68,68,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <span>{isPriceFixed ? '¡Aceptar y Crear Trato!' : '¡Generar Link de Trato!'} 🚀</span>
            </button>
            
            <p className="text-center text-xs font-bold text-gray-400 px-4 leading-relaxed">
              Al {isPriceFixed ? 'aceptar' : 'generar el link'}, el dinero quedará protegido en el cofre hasta que ambos confirmen que el trato fue un éxito.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDeal;
