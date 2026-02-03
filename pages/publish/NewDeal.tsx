
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../App';


const NewDeal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const state = location.state || {};
  const seller = {
    sellerName: state.sellerName || 'Vendedor',
    sellerAvatar: state.sellerAvatar || 'https://picsum.photos/400/400?person=99',
    productTitle: state.productTitle || '',
    productPrice: state.productPrice || ''
  };

  const [title, setTitle] = useState(seller.productTitle);
  const [amount, setAmount] = useState(seller.productPrice.toString());
  const [description, setDescription] = useState('');

  // Fixed price if coming from product detail
  const isPriceFixed = !!seller.productPrice;

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      notify({
        type: 'warning',
        title: 'Información incompleta',
        message: 'Por favor, completa los campos obligatorios para continuar.',
        icon: 'warning'
      });
      return;
    }

    notify({
      type: 'info',
      title: 'Procesando Trato',
      message: `Configurando tu transacción protegida para "${title}".`,
      icon: 'sync'
    });

    setTimeout(() => {
      navigate('/checkout', { state: { title, amount, sellerName: seller.sellerName } });
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-dark-charcoal mb-4">Confirmación de Trato</h1>
        <p className="text-gray-500 font-medium">Estás iniciando una transacción protegida por nuestra garantía de satisfacción.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* Advice Section */}
        <div className="md:col-span-4 space-y-6">
          <div className="bg-primary-50 p-6 rounded-lg border border-primary-100">
            <div className="flex items-center gap-2 text-primary-700 font-black text-xs uppercase tracking-widest mb-3">
              <span className="material-symbols-outlined text-base">shield_heart</span>
              Zona Segura
            </div>
            <p className="text-sm text-primary-800 leading-relaxed font-medium">
              {isPriceFixed
                ? "El precio ha sido fijado por el vendedor según la publicación oficial. Revisa los detalles antes de pagar."
                : "Asegúrate de describir el objeto con precisión. Los detalles claros previenen disputas futuras."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-border-light shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <img src={seller.sellerAvatar} alt="Seller" className="size-10 rounded-full object-cover border border-gray-100" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Vendedor</p>
                <h4 className="font-bold text-dark-charcoal">{seller.sellerName}</h4>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-primary-600 uppercase tracking-tighter">
              <span className="material-symbols-outlined text-sm">verified</span> Identidad Validada
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleCreateDeal} className="md:col-span-8 bg-white p-8 md:p-10 rounded-xl border border-border-light shadow-trust-lg">
          <div className="space-y-8">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Objeto del Trato</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                readOnly={isPriceFixed}
                className={`w-full px-5 py-3.5 rounded-xl border border-border-light font-bold text-dark-charcoal focus:border-dark-charcoal/30 focus:ring-4 focus:ring-dark-charcoal/5 transition-all outline-none ${isPriceFixed ? 'bg-light-50 cursor-not-allowed text-gray-400' : ''}`}
                placeholder="Nombre del producto o servicio..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-xs font-black uppercase tracking-widest text-gray-400">Importe a Custodiar (ARS)</label>
                {isPriceFixed && (
                  <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100 uppercase">
                    Precio Publicado
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-dark-charcoal/30">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  readOnly={isPriceFixed}
                  className={`w-full pl-10 pr-5 py-3.5 rounded-xl border border-border-light font-black text-dark-charcoal text-xl focus:border-dark-charcoal/30 focus:ring-4 focus:ring-dark-charcoal/5 transition-all outline-none ${isPriceFixed ? 'bg-light-50 cursor-not-allowed text-gray-400' : ''}`}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Especificaciones (Opcional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-5 py-3.5 rounded-xl border border-border-light font-bold text-dark-charcoal focus:border-dark-charcoal/30 focus:ring-4 focus:ring-dark-charcoal/5 transition-all outline-none resize-none"
                placeholder="Aclara estado, condiciones de entrega o fallas si las hubiera..."
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-5 bg-dark-charcoal text-white text-lg font-black rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-dark-charcoal/10 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <span>{isPriceFixed ? 'Confirmar Compra Segura' : 'Generar Trato'}</span>
              </button>

              <div className="mt-6 flex items-start gap-3 bg-light-50 p-4 rounded-xl border border-border-light">
                <span className="material-symbols-outlined text-gray-400 text-sm mt-0.5">info</span>
                <p className="text-[10px] font-bold text-gray-500 leading-normal">
                  Al confirmar, estarás utilizando nuestro sistema de Escrow. El dinero será retenido en una cuenta segura y solo se liberará al vendedor cuando confirmes la recepción conforme.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewDeal;
