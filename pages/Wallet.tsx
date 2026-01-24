
import React from 'react';

const Wallet = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-800 font-hand mb-2">¡Bienvenido a tu Billetera Feliz!</h1>
        <p className="text-gray-500 italic">Un espacio tranquilo para que tus ahorros florezcan ✨</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-coral-soft p-8 text-white rounded-[3rem] shadow-lg transform rotate-[-1deg] flex flex-col items-center text-center">
              <p className="text-sm font-bold opacity-90 mb-1 uppercase tracking-widest">Listo para usar</p>
              <p className="text-3xl font-black mb-2">$125.400,00</p>
              <div className="bg-white/20 px-3 py-1 rounded-full text-xs">¡Creciendo hoy! 🌸</div>
            </div>
            <div className="bg-sky-soft p-8 text-blue-600 rounded-[3rem] shadow-lg transform rotate-[2deg] flex flex-col items-center text-center">
              <p className="text-sm font-bold opacity-80 mb-1 uppercase tracking-widest">En descanso</p>
              <p className="text-3xl font-black mb-2">$45.000,00</p>
              <div className="bg-white/40 px-3 py-1 rounded-full text-xs font-bold">Ventas en paz</div>
            </div>
            <div className="bg-lemon-soft p-8 text-yellow-700 rounded-[3rem] shadow-lg transform rotate-[-1deg] flex flex-col items-center text-center">
              <p className="text-sm font-bold opacity-80 mb-1 uppercase tracking-widest">Llegando pronto</p>
              <p className="text-3xl font-black mb-2">$12.300,00</p>
              <div className="bg-white/50 px-3 py-1 rounded-full text-xs font-bold">Camino a casa ✨</div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm p-8 rounded-[2.5rem] border-4 border-white shadow-xl shadow-coral-soft/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-lg font-bold text-gray-700 font-hand uppercase tracking-wide">Tus alegrías del mes</p>
                <h3 className="text-2xl font-black text-coral-soft">+$182.700,00</h3>
              </div>
              <div className="bg-mint-soft/30 px-6 py-2 rounded-full text-emerald-700 font-bold text-sm">Últimos 30 días mágicos</div>
            </div>
            <div className="h-48 w-full bg-mint-soft/10 rounded-[2rem] flex items-end p-4 gap-2">
              {[40, 60, 45, 90, 65, 80, 70, 95].map((h, i) => (
                <div key={i} className="flex-1 bg-coral-soft/40 rounded-t-xl hover:bg-coral-soft transition-colors cursor-pointer" style={{ height: h + '%' }}></div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[3rem] border-4 border-white shadow-xl overflow-hidden">
            <div className="p-8 border-b border-pink-50 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800 font-hand">El diario de tu dinero ✨</h3>
              <button className="px-6 py-2 text-sm font-bold text-coral-soft bg-coral-soft/10 rounded-full">Ver todo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#FFF9F0]/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Momento</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">¿Qué pasó?</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-50">
                  {[
                    { date: '24 de Mayo', action: 'Vendiste tu PlayStation 5', status: '¡Completado!', amount: '+$650.000,00', icon: 'redeem', pos: true },
                    { date: '22 de Mayo', action: 'Retiro al Banco Galicia', status: 'Viajando...', amount: '-$120.000,00', icon: 'flight_takeoff', pos: false },
                    { date: '20 de Mayo', action: 'Venta: Monitor Gamer 27"', status: '¡Éxito!', amount: '+$85.000,00', icon: 'monitor', pos: true }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-mint-soft/10 transition-colors">
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-gray-400">{row.date}</td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 rounded-full ${row.pos ? 'bg-lemon-soft' : 'bg-sky-soft'} flex items-center justify-center text-2xl mr-4`}>
                            <span className="material-symbols-outlined">{row.icon}</span>
                          </div>
                          <span className="text-lg font-bold text-gray-700 font-hand">{row.action}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${row.pos ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className={`px-8 py-6 whitespace-nowrap text-right text-lg font-black ${row.pos ? 'text-emerald-500' : 'text-gray-800'}`}>{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[3rem] border-4 border-dashed border-coral-soft/30 shadow-xl relative overflow-hidden">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center font-hand">¡Disfruta tus logros! 🎁</h3>
            <div className="space-y-8 relative z-10">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-3 text-center uppercase tracking-widest">¿Cuánto quieres retirar?</label>
                <div className="relative">
                  <input className="w-full py-5 bg-[#FFF9F0] border-2 border-transparent focus:border-coral-soft focus:ring-0 rounded-[3rem] text-3xl font-black text-center text-gray-800 placeholder-gray-300" placeholder="0,00" />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-coral-soft font-black text-xl">$</div>
                </div>
                <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase">A partir de $1.000 para celebrar</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-4 text-center uppercase tracking-widest">Destino de tu alegría</label>
                <div className="space-y-4">
                  <div className="flex items-center p-5 bg-mint-soft/50 border-2 border-emerald-200 rounded-[3rem] cursor-pointer">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-emerald-100">
                      <span className="material-symbols-outlined text-emerald-500">account_balance</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-black text-emerald-800">Mi Cuenta Principal</p>
                      <p className="text-[10px] font-bold text-emerald-600/60 uppercase">CBU **** 4921</p>
                    </div>
                    <span className="material-symbols-outlined ml-auto text-emerald-500">check_circle</span>
                  </div>
                </div>
              </div>
              <button className="w-full bg-coral-soft text-white py-5 rounded-[3rem] font-black text-xl shadow-xl shadow-coral-soft/40 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3">
                <span>¡Enviar a mi banco!</span>
                <span className="material-symbols-outlined">celebration</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
