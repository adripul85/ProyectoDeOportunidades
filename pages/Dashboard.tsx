
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotification } from '../App';

const Dashboard = () => {
  const { notify } = useNotification();
  const navigate = useNavigate();

  const simulatePayment = () => {
    notify({
      type: 'success',
      title: '¡Pago Recibido! 💰',
      message: 'Juan Pérez ha enviado $45.000 para el iPhone 13. El dinero está a salvo en el cofre.',
      icon: 'payments'
    });
  };

  const simulateShipping = () => {
    notify({
      type: 'info',
      title: '¡Paquete en viaje! 📦',
      message: 'Tu monitor ya fue despachado. Puedes ver el seguimiento en los detalles del trato.',
      icon: 'local_shipping'
    });
  };

  const currentDeals = [
    {
      id: 2,
      title: 'iPhone 13 Pro Max - 128GB',
      category: '¡Es un Producto!',
      img: 'https://picsum.photos/400/300?iphone',
      seller: 'Juan Pérez',
      status: '¡Ya va volando hacia vos!',
      progress: 75,
      time: 'Hace 2 horitas',
      color: 'bg-mint-soft/30',
      textColor: 'text-emerald-600'
    },
    {
      id: 7,
      title: 'Landing Page E-commerce',
      category: 'Un servicio brillante',
      img: 'https://picsum.photos/400/300?web',
      seller: 'Agencia Digital BA',
      status: '¡A punto de arrancar!',
      progress: 25,
      time: 'Ayer por la tarde',
      color: 'bg-sky-soft/30',
      textColor: 'text-blue-600'
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <aside className="w-full lg:w-72 bg-white/70 backdrop-blur-md lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] flex flex-col p-8 border-r border-mint-soft/30">
        <nav className="flex flex-col gap-4 flex-1">
          <Link to="/dashboard" className="bg-coral-soft/10 text-coral-soft font-bold flex items-center gap-4 px-6 py-4 rounded-full">
            <span className="material-symbols-outlined">home_app_logo</span>
            <span className="text-lg">Mi Tablero</span>
          </Link>
          <Link to="/wallet" className="flex items-center gap-4 px-6 py-4 rounded-full text-gray-500 hover:bg-mint-soft/20 hover:text-gray-800 transition-all">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-lg">Billetera</span>
          </Link>
          <Link to="/profile" className="flex items-center gap-4 px-6 py-4 rounded-full text-gray-500 hover:bg-mint-soft/20 hover:text-gray-800 transition-all">
            <span className="material-symbols-outlined">face_6</span>
            <span className="text-lg">Mi Perfil</span>
          </Link>
        </nav>
        <div className="mt-8 flex flex-col gap-6">
          <div className="relative group/tooltip">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-white hand-drawn-border text-[10px] font-black uppercase tracking-wider text-dark-charcoal whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 group-hover/tooltip:-top-14 transition-all pointer-events-none z-50 shadow-lg">
              Iniciar un nuevo trato
              <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-dark-charcoal"></div>
            </div>
            
            <button 
              onClick={() => navigate('/new-trato')}
              className="flex w-full items-center justify-center gap-3 hand-drawn-card bg-berry h-14 text-white font-bold shadow-[4px_4px_0px_rgba(68,68,68,1)] hover:translate-x-1 hover:translate-y-1 hover:scale-[1.02] hover:shadow-none active:translate-y-[4px] active:shadow-none transition-all"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Nuevo Trato</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12">
        <header className="mb-14 flex flex-wrap justify-between items-center gap-6">
          <div>
            <h2 className="font-display text-[#2D3436] text-4xl font-bold mb-3">¡Hola de nuevo! ✨</h2>
            <p className="text-gray-500 text-xl font-medium">Todo está listo para que operes con tranquilidad.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={simulatePayment} className="text-[10px] uppercase font-black px-4 py-2 bg-mint-soft rounded-full hover:brightness-95 transition-all">Test Pago</button>
              <button onClick={simulateShipping} className="text-[10px] uppercase font-black px-4 py-2 bg-sky-soft rounded-full hover:brightness-95 transition-all">Test Envío</button>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold bg-white px-6 py-3 rounded-full shadow-sm border border-mint-soft/20">
              <span className="material-symbols-outlined text-mint-soft text-2xl">verified</span>
              <span className="text-gray-600">¡Tu identidad brilla!</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16 relative">
          {[
            { label: 'Para usar ahora', val: '$120.500', note: '¡LISTO PARA DISFRUTAR!', color: 'bg-mint-soft', icon: 'savings' },
            { label: 'Protegido con amor', val: '$45.000', note: 'DEPÓSITO EN CUSTODIA', color: 'bg-coral-soft', icon: 'shield_person' },
            { label: 'Casi en tus manos', val: '$15.200', note: 'PRÓXIMA LIBERACIÓN', color: 'bg-white', icon: 'hourglass_top', border: 'border-2 border-dashed border-sky-soft' }
          ].map((card, i) => (
            <div key={i} className="relative group">
              <div className={`absolute inset-0 ${card.color.includes('white') ? 'bg-sky-soft/20' : card.color+'/20'} blur-2xl rounded-full scale-110 group-hover:scale-125 transition-transform`}></div>
              <div className={`relative rounded-[3rem] p-10 flex flex-col items-center text-center shadow-lg hover:rotate-2 transition-transform cursor-default ${card.color} ${card.border || ''}`}>
                <span className={`material-symbols-outlined text-4xl mb-4 ${card.color.includes('coral') ? 'text-white' : 'text-emerald-600'}`}>{card.icon}</span>
                <span className={`${card.color.includes('coral') ? 'text-white/80' : 'text-emerald-800'} text-xs font-bold uppercase tracking-widest mb-1`}>{card.label}</span>
                <p className={`${card.color.includes('coral') ? 'text-white' : 'text-emerald-900'} text-4xl font-display font-bold`}>{card.val}</p>
                <p className={`${card.color.includes('coral') ? 'text-white/60' : 'text-emerald-700/60'} text-[10px] mt-2 font-bold`}>{card.note}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[#2D3436] text-3xl font-bold">Tratos en curso 🎈</h3>
            <button className="text-coral-soft font-bold hover:scale-110 transition-transform flex items-center gap-1">
              <span>Historial de éxitos</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          <div className="flex flex-col gap-8">
            {currentDeals.map((deal) => (
              <div 
                key={deal.id} 
                onClick={() => navigate(`/esgrow/${deal.id}`)}
                className="bg-white rounded-[2.5rem] p-6 flex flex-col lg:flex-row gap-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 group cursor-pointer"
              >
                <div 
                  className="h-48 lg:h-44 w-full lg:w-72 rounded-[2rem] bg-center bg-cover shadow-inner transition-transform group-hover:scale-[1.02]" 
                  style={{ backgroundImage: `url('${deal.img}')` }}
                ></div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-4 py-1 rounded-full ${deal.color} ${deal.textColor} text-[10px] font-bold uppercase tracking-widest`}>
                        {deal.category}
                      </span>
                      <span className="text-gray-400 text-xs">{deal.time}</span>
                    </div>
                    <h4 className="text-2xl font-display font-bold text-gray-800">{deal.title}</h4>
                    <p className="text-gray-500 mt-2 font-medium">
                      Con <span className="text-coral-soft font-bold">{deal.seller}</span>.
                    </p>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-gray-700">Estado: <span className="text-emerald-500 font-extrabold italic">{deal.status}</span></span>
                      <span className="bg-mint-soft text-emerald-800 text-xs px-2 py-1 rounded-full font-bold">{deal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-4 rounded-full p-1 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-200 to-emerald-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${deal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center lg:pl-8 border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0">
                  <button className="w-full lg:w-auto px-10 py-4 rounded-full bg-gray-900 text-white font-bold group-hover:bg-coral-soft transition-all shadow-lg text-center">
                    Ver en ESgrow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-16 rounded-[3rem] bg-gradient-to-br from-indigo-500 to-berry p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden relative shadow-2xl">
          <div className="relative z-10 max-w-lg">
            <h3 className="font-display text-4xl font-bold mb-4">¿Vendés con alegría? 🌈</h3>
            <p className="text-indigo-100 text-lg">Asegurá tus ventas en redes sociales. Usá De Oportunidades para que el dinero llegue siempre a destino.</p>
            <button className="mt-8 px-10 py-4 bg-white text-indigo-600 font-bold rounded-full hover:scale-105 transition-transform shadow-xl shadow-black/20">
              ¡Crear mi Link Mágico ahora!
            </button>
          </div>
          <div className="absolute -right-16 -bottom-16 text-white opacity-10">
            <span className="material-symbols-outlined text-[320px]">spa</span>
          </div>
          <div className="relative z-10 hidden md:block">
            <div className="w-40 h-40 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
              <span className="material-symbols-outlined text-[100px] text-white">volunteer_activism</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
