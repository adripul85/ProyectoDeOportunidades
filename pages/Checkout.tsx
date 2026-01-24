
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../App';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [paymentMethod, setPaymentMethod] = useState<'saldo' | 'transfer' | 'card'>('saldo');

  const state = location.state || { title: 'Sony Alpha a7 III - Kit Completo', amount: '1250000', sellerName: '@tech_expert_22' };
  const amountNum = parseFloat(state.amount) || 0;
  const protectionFee = amountNum * 0.03;
  const total = amountNum + protectionFee;

  const handlePay = () => {
    notify({
      type: 'success',
      title: '¡Fondeo exitoso! ✨',
      message: 'Tu dinero ya está seguro en el cofre mágico.',
      icon: 'celebration'
    });
    setTimeout(() => {
      navigate('/success', { state: { ...state, total, protectionFee } });
    }, 1500);
  };

  return (
    <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-7 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl md:text-5xl font-bold text-dark-charcoal font-display leading-tight">Fondeo con Alegría ✨</h1>
          <p className="text-lg text-coral-soft font-medium">Estamos listos para cuidar tu tesoro hasta que el trato se complete.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Saldo De Oportunidades */}
          <div 
            onClick={() => setPaymentMethod('saldo')}
            className={`cursor-pointer p-6 rounded-[2rem] border-4 flex items-center gap-6 transition-all shadow-xl shadow-coral-soft/5 ${paymentMethod === 'saldo' ? 'border-coral-soft bg-white' : 'border-transparent bg-white/40 opacity-70 hover:opacity-100'}`}
          >
            <div className={`size-16 rounded-2xl flex items-center justify-center shrink-0 ${paymentMethod === 'saldo' ? 'bg-coral-soft/20 text-coral-soft' : 'bg-slate-100 text-slate-400'}`}>
              <span className="material-symbols-outlined text-4xl">savings</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold font-display">Saldo De Oportunidades</h3>
              <p className="text-sm opacity-70">Usa tus ahorros guardados en el cofre.</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${paymentMethod === 'saldo' ? 'text-coral-soft' : 'text-slate-900'}`}>$15.400</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-coral-soft">Usar ahora</span>
            </div>
          </div>

          {/* Transferencia Mágica */}
          <div 
            onClick={() => setPaymentMethod('transfer')}
            className={`cursor-pointer p-6 rounded-[2rem] border-4 flex items-center gap-6 transition-all shadow-lg ${paymentMethod === 'transfer' ? 'border-menta bg-white shadow-menta/10' : 'border-transparent bg-white/40 opacity-70 hover:opacity-100'}`}
          >
            <div className={`size-16 rounded-2xl flex items-center justify-center shrink-0 ${paymentMethod === 'transfer' ? 'bg-menta/20 text-menta' : 'bg-slate-100 text-slate-400'}`}>
              <span className="material-symbols-outlined text-4xl">account_balance</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-display">Transferencia Mágica</h3>
                <span className="bg-menta text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-5% OFF</span>
              </div>
              <p className="text-sm opacity-70">CBU/CVU de acreditación veloz.</p>
            </div>
            <div className={`size-8 rounded-full border-4 flex items-center justify-center ${paymentMethod === 'transfer' ? 'border-menta' : 'border-slate-200'}`}>
              {paymentMethod === 'transfer' && <div className="size-3 rounded-full bg-menta"></div>}
            </div>
          </div>

          {/* Tarjetas Amigas */}
          <div 
            onClick={() => setPaymentMethod('card')}
            className={`cursor-pointer p-6 rounded-[2rem] border-4 flex flex-col gap-6 transition-all shadow-lg ${paymentMethod === 'card' ? 'border-menta bg-white' : 'border-transparent bg-white/40 opacity-70 hover:opacity-100'}`}
          >
            <div className="flex items-center gap-6">
              <div className={`size-16 rounded-2xl flex items-center justify-center shrink-0 ${paymentMethod === 'card' ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                <span className="material-symbols-outlined text-4xl">credit_card</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold font-display">Tarjetas Amigas</h3>
                <p className="text-sm opacity-70">Visa, Mastercard y más.</p>
              </div>
              <div className={`size-8 rounded-full border-4 flex items-center justify-center ${paymentMethod === 'card' ? 'border-menta' : 'border-slate-200'}`}>
                {paymentMethod === 'card' && <div className="size-3 rounded-full bg-menta"></div>}
              </div>
            </div>
            
            {paymentMethod === 'card' && (
              <div className="grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-4">
                <input className="col-span-4 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 focus:border-menta focus:ring-0 transition-all font-medium" placeholder="Número de tu tarjeta mágica" type="text"/>
                <input className="col-span-2 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 focus:border-menta focus:ring-0 transition-all font-medium" placeholder="MM/AA" type="text"/>
                <input className="col-span-2 rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 focus:border-menta focus:ring-0 transition-all font-medium" placeholder="CVC" type="text"/>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-8 bg-white/40 rounded-[2.5rem] border-2 border-dashed border-menta/30">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl text-menta">auto_fix_high</span>
            <div>
              <h4 className="font-bold font-display">Tu dinero va al cofre mágico</h4>
              <p className="text-sm opacity-70">Se queda flotando en una nube segura hasta que digas "¡Todo perfecto!". Solo ahí el vendedor recibe sus monedas.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl text-coral-soft">shield_person</span>
            <div>
              <h4 className="font-bold font-display">Escudo invisible de datos</h4>
              <p className="text-sm opacity-70">Toda tu información viaja por túneles secretos encriptados con hechizos nivel bancario.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="sticky top-28">
          <div className="irregular-border-bottom bg-white p-8 md:p-10 mb-8 rounded-t-[3rem] shadow-2xl">
            <div className="text-center mb-8 border-b-2 border-dashed border-gray-200 pb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 font-display">Nota de Almacén De Oportunidades</p>
              <h3 className="text-2xl font-bold font-display">Resumen de tu Trato</h3>
            </div>
            <div className="flex gap-4 mb-8">
              <div className="size-20 rounded-2xl bg-cover bg-center shrink-0 rotate-[-3deg] shadow-lg border-2 border-white" style={{ backgroundImage: "url('https://picsum.photos/400/400?tech')" }}></div>
              <div className="flex flex-col justify-center">
                <p className="text-sm font-bold leading-tight font-display">{state.title}</p>
                <p className="text-xs text-coral-soft font-bold mt-1">Con {state.sellerName}</p>
              </div>
            </div>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm italic text-gray-600">
                <span>Precio del tesoro</span>
                <span className="font-bold text-dark-charcoal font-display">${amountNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm italic text-gray-600">
                <span>Hechizo de protección</span>
                <span className="font-bold text-dark-charcoal font-display">${protectionFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm italic text-menta font-bold">
                <span>Envío veloz</span>
                <span className="uppercase">¡Gratis!</span>
              </div>
            </div>
            <div className="border-t-2 border-dashed border-gray-200 pt-6 mb-10">
              <div className="flex justify-between items-end">
                <p className="text-lg font-bold font-display">Total a Fondear</p>
                <p className="text-4xl font-black text-coral-soft tracking-tight font-display">${total.toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={handlePay}
              className="w-full bg-menta py-6 rounded-full text-dark-charcoal font-bold text-xl flex items-center justify-center gap-3 shadow-xl shadow-menta/30 hover:scale-[1.02] active:scale-95 transition-all organic-border border-b-8 border-menta-dark"
            >
              Pagar con Alegría
              <span className="material-symbols-outlined">celebration</span>
            </button>
          </div>
          <div className="bg-coral-soft/10 rounded-[2rem] p-6 border-2 border-coral-soft/20 flex gap-4">
            <span className="material-symbols-outlined text-4xl text-coral-soft animate-bounce">verified_user</span>
            <div>
              <p className="font-bold font-display">Trato Seguro 100%</p>
              <p className="text-sm opacity-80 leading-snug">Liberamos las monedas solo cuando confirmes que tu paquete llegó y estás saltando de felicidad.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
