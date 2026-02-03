import React from 'react';
import { useAuth } from '../lib/auth';

const Wallet = () => {
  const { userProfile } = useAuth();
  const wallet = userProfile?.wallet || { available: 0, inEscrow: 0, pending: 0, currency: 'ARS' };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 pb-24 bg-light-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-dark-800 mb-2">Mi Billetera Digital</h1>
        <p className="text-sm font-bold text-gray-400">Administra tus ganancias, fondos en garantía y retiros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-800 p-8 text-white rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 size-32 bg-primary-vibrant/20 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[10px] font-black opacity-50 mb-6 uppercase tracking-[0.2em] relative z-10">Total Disponible</p>
              <p className="text-4xl font-black mb-10 relative z-10">${wallet.available.toLocaleString()}</p>
              <div className="bg-primary-vibrant text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 w-fit relative z-10">
                Activo Verificado
              </div>
            </div>

            <div className="bg-white p-8 text-dark-800 rounded-[40px] shadow-premium border border-light-200 flex flex-col">
              <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">En Garantía</p>
              <p className="text-3xl font-black mb-10">${wallet.inEscrow.toLocaleString()}</p>
              <div className="bg-primary-50 text-primary-vibrant px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary-100 w-fit">
                Fondos Protegidos
              </div>
            </div>

            <div className="bg-white p-8 text-dark-800 rounded-[40px] shadow-premium border border-light-200 flex flex-col">
              <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">Liquidación Pendiente</p>
              <p className="text-3xl font-black mb-10">${wallet.pending.toLocaleString()}</p>
              <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 w-fit">
                En Proceso
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-4xl border border-light-200 shadow-premium">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-dark-800 mb-1">Volumen de Actividad</h3>
                <p className="text-xs font-bold text-gray-400">Movimientos agregados en los últimos 30 días</p>
              </div>
              <div className="bg-light-100 px-4 py-2 rounded-xl text-dark-800 font-black text-[10px] uppercase tracking-widest">
                Sincronización en Tiempo Real
              </div>
            </div>
            <div className="h-48 w-full flex items-end justify-between gap-3 px-4">
              {[40, 60, 45, 90, 65, 80, 70, 95, 55, 75, 85, 60].map((h, i) => (
                <div
                  key={i}
                  className="w-full bg-light-100 rounded-xl hover:bg-primary-vibrant transition-all cursor-pointer group relative"
                  style={{ height: h + '%' }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark-800 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ${(h * 120).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-4xl border border-light-200 shadow-premium overflow-hidden">
            <div className="px-10 py-8 border-b border-light-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-dark-800">Historial de Transacciones</h3>
              <button className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest hover:underline transition-all">Descargar CSV</button>
            </div>
            <div className="p-20 text-center">
              <div className="size-16 bg-light-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-gray-400">history</span>
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                No hay movimientos registrados en este período.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 xl:sticky xl:top-24 h-fit">
          <div className="bg-white p-10 rounded-4xl border-2 border-dark-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 size-20 bg-dark-800/5 -mr-5 -mt-5 rounded-full"></div>
            <h3 className="text-2xl font-black text-dark-800 mb-10">Retirar Fondos</h3>
            <div className="space-y-12">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest ml-1">Monto a Transferir</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-800/20 font-black text-2xl">$</span>
                  <input className="w-full pl-12 pr-8 py-6 bg-light-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-3xl text-3xl font-black text-dark-800 outline-none transition-all placeholder:text-light-200" placeholder="0.00" />
                </div>
                <div className="flex justify-between items-center mt-4 px-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Retiro Mín.: $1,000</p>
                  <button className="text-[10px] text-primary-vibrant font-black uppercase tracking-widest hover:underline">Retirar Todo</button>
                </div>
              </div>

              <div className="pt-8 border-t border-light-100">
                <label className="block text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest ml-1">Cuenta de Destino</label>
                <button className="w-full py-5 border-2 border-dashed border-light-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-light-50 transition-all flex items-center justify-center gap-3">
                  <span className="material-symbols-outlined text-sm">account_balance</span>
                  Vincular Cuenta Bancaria (CBU/CVU)
                </button>
              </div>

              <button className="w-full bg-dark-800 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-dark-800/10 hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-3">
                <span className="material-symbols-outlined text-lg">bolt</span>
                Procesar Retiro
              </button>

              <div className="bg-primary-50/50 p-6 rounded-3xl border border-primary-100/50">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary-vibrant text-xl font-black">shield</span>
                  <p className="text-[10px] font-bold text-primary-800/60 leading-relaxed uppercase">
                    Los retiros se procesan al instante en días hábiles (09:00 - 18:00). Todos los fondos están protegidos por nuestro fondo de garantía de satisfacción.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
