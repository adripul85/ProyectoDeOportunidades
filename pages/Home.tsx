
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div>
      <section className="relative py-20 lg:py-32 overflow-hidden bg-white paper-texture">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-block bg-white px-4 py-1 rounded-full hand-drawn-border mb-6 rotate-[-2deg]">
                <span className="text-sm font-bold">✨ ¿Vendes o compras algo?</span>
              </div>
              <h1 className="text-4xl sm:text-6xl font-black leading-tight mb-8 text-dark-charcoal font-display">
                ¿Y si pudieras comprar <span className="text-berry">sin miedo</span>, como quien le da la mano a un amigo?
              </h1>
              <p className="text-xl text-dark-charcoal/80 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-semibold">
                ¡Hola! Somos De Oportunidades. Cuidamos tu dinero en un cofre mágico hasta que tu paquete llegue a casa sano y salvo. ¿Hacemos un trato?
              </p>
              
              <div className="mb-12 max-w-lg mx-auto lg:mx-0">
                <form onSubmit={handleHeroSearch} className="relative group">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿Qué tesoro buscas hoy? Ej: iPhone, Monitor..." 
                    className="w-full py-5 px-8 pr-20 bg-white hand-drawn-card text-lg font-handwritten focus:ring-4 focus:ring-menta/20 focus:border-menta transition-all outline-none"
                  />
                  <button 
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-menta p-3 rounded-2xl hand-drawn-border hover:scale-110 active:scale-95 transition-all shadow-md"
                  >
                    <span className="material-symbols-outlined text-dark-charcoal font-bold">search</span>
                  </button>
                </form>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                <Link to="/dashboard" className="w-full sm:w-auto px-10 py-5 bg-coral-soft text-dark-charcoal text-xl font-bold rounded-full hand-drawn-border shadow-[6px_6px_0px_0px_rgba(16,34,24,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all text-center">
                  ¡Vender algo ahora! 🚀
                </Link>
                <div className="flex items-center gap-3 text-sm font-bold text-dark-charcoal/60 bg-white/50 px-5 py-2 rounded-full border-2 border-dashed border-dark-charcoal/20">
                  <span className="material-symbols-outlined text-green-500">verified</span>
                  Tratos 100% protegidos
                </div>
              </div>
            </div>
            <div className="flex-1 w-full flex justify-center">
              <div className="relative max-w-md">
                <div className="w-full h-[400px] bg-sky-soft organic-border flex items-center justify-center relative overflow-hidden border-4 border-white shadow-2xl">
                  <img alt="Trato seguro" className="w-full h-full object-cover grayscale opacity-30 mix-blend-multiply" src="https://picsum.photos/800/600?nature" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-9xl text-dark-charcoal/20">diversity_1</span>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-white p-4 hand-drawn-border rotate-6 shadow-xl">
                    <span className="text-3xl">🤝</span>
                  </div>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 bg-white p-4 hand-drawn-card shadow-xl rotate-[-2deg]">
                  <div className="flex items-center gap-3">
                    <div className="bg-menta/20 p-2 rounded-full">
                      <span className="material-symbols-outlined text-menta-dark font-bold">lock_open</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-50">Estado de la magia</p>
                      <p className="text-sm font-bold">Dinero a salvo en el cofre</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-coral-soft/10 organic-border -z-0 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-menta/10 organic-border -z-0 rotate-45"></div>
      </section>

      <section className="py-12 bg-white border-y-4 border-dashed border-dark-charcoal/5">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-bold text-dark-charcoal/40 uppercase tracking-widest mb-10 italic">Nuestros amigos de confianza...</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24">
            {['Mercado', 'Tarjetas', 'Stripe', 'PayPal'].map((name, i) => (
              <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                <div className={`hand-drawn-border p-3 transition-colors ${i%2===0 ? 'group-hover:bg-coral-soft' : 'group-hover:bg-menta'}`}>
                  <span className="material-symbols-outlined text-3xl">
                    {['payments', 'credit_card', 'account_balance', 'account_balance_wallet'][i]}
                  </span>
                </div>
                <span className="font-bold text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white" id="como-funciona">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black mb-6 font-display">¿Cómo funciona esta aventura?</h2>
            <p className="text-lg font-bold text-dark-charcoal/60 max-w-2xl mx-auto italic">¡Es tan fácil como contar 1, 2, 3! Sin palabras complicadas, solo buenas vibras.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-1/2 left-[25%] right-[25%] h-1 border-t-4 border-dashed border-coral-soft -z-0"></div>
            {[
              { num: 1, icon: 'edit_note', title: '¿Te pusiste de acuerdo?', desc: 'Chatea con tu vendedor o comprador, pacten el precio y crea un link de trato seguro.', color: 'bg-coral-soft' },
              { num: 2, icon: 'savings', title: '¡Al cofre de seguridad!', desc: 'El comprador paga y De Oportunidades guarda el dinero. Le avisamos al vendedor para que envíe.', color: 'bg-menta' },
              { num: 3, icon: 'auto_awesome', title: '¡Todo feliz, pago libre!', desc: '¿Recibiste lo que querías? ¡Genial! Aprieta el botón mágico para liberar el dinero.', color: 'bg-sky-soft' }
            ].map((step, i) => (
              <div key={i} className="relative bg-white p-8 hand-drawn-card hover:-rotate-2 transition-transform shadow-lg">
                <div className={`absolute -top-6 -left-4 ${step.color} w-12 h-12 flex items-center justify-center font-black text-2xl hand-drawn-border rotate-6 shadow-md`}>{step.num}</div>
                <div className={`mb-6 ${step.color}/20 w-16 h-16 rounded-2xl flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-4xl">{step.icon}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 font-display">{step.title}</h3>
                <p className="font-semibold text-dark-charcoal/70 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-coral-soft/5" id="seguridad">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-berry text-white px-4 py-1 rounded-full text-xs font-bold mb-6">
                <span className="material-symbols-outlined text-sm">verified_user</span> TU SEGURIDAD ES SAGRADA
              </div>
              <h2 className="text-4xl lg:text-5xl font-black mb-8 leading-tight font-display">¿Por qué estarás tan tranquilo como un gatito durmiendo?</h2>
              <p className="text-lg font-bold text-dark-charcoal/60 mb-12 font-handwritten">
                Nuestra tecnología no es aburrida, es poderosa. Hemos creado un escudo invisible para que nada arruine tu día.
              </p>
              <div className="space-y-8">
                {[
                  { icon: 'forum', title: 'Un chat que todo lo ve', desc: 'Guardamos el chat como prueba legal por si alguien se porta mal.' },
                  { icon: 'photo_camera', title: 'Álbum de Recuerdos', desc: 'Sube fotos de cómo envías o recibes las cosas. ¡Las imágenes no mienten!' },
                  { icon: 'sentiment_satisfied', title: 'Puntos de Buena Gente', desc: 'Mira la reputación de los demás. Ser un buen negociante tiene premio.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="shrink-0 size-14 bg-white hand-drawn-card flex items-center justify-center text-berry group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2 font-display">{item.title}</h4>
                      <p className="font-semibold text-dark-charcoal/70">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="bg-white p-6 hand-drawn-card shadow-2xl rotate-2 relative overflow-hidden border-4 border-dark-charcoal">
                <img alt="Seguridad" className="w-full grayscale opacity-20" src="https://picsum.photos/600/400?tech" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-24 h-24 bg-menta rounded-full flex items-center justify-center mb-6 hand-drawn-border rotate-[-6deg] shadow-lg">
                    <span className="material-symbols-outlined text-5xl text-dark-charcoal">shield_with_heart</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 font-display">¡Todo bajo control!</h3>
                  <p className="font-bold text-dark-charcoal/60">Estamos vigilando para que tú solo disfrutes de tu compra.</p>
                </div>
              </div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-lemon-soft hand-drawn-border rounded-full flex items-center justify-center rotate-12 shadow-lg">
                <span className="font-black text-center text-sm leading-tight font-display">PROTECCIÓN<br/>EXTRA<br/>✨✨</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-sky-soft/20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-4 font-display">¿Qué cuentan nuestros aventureros?</h2>
            <p className="text-lg font-bold text-dark-charcoal/60 italic">Historias reales de gente que ya no tiene pesadillas al comprar.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-10 lg:gap-16">
            {[
              { name: 'Carlos R.', role: 'Vendedor Valiente', color: 'bg-coral-soft', text: '¿Bici nueva a través del país? ¡Daba miedo! Pero con De Oportunidades sentí que alguien me cuidaba.' },
              { name: 'Sofía M.', role: 'Compradora Feliz', color: 'bg-menta', text: 'Facebook Marketplace era una selva. Ahora solo cierro tratos si hay un cofre de garantía. ¡Paz mental!' },
              { name: 'Martín P.', role: 'Diseñador Relax', color: 'bg-lemon-soft', text: 'Como freelance, siempre dudaba si me pagarían. Ahora envío el link y el cliente deposita tranquilo.' }
            ].map((test, i) => (
              <div key={i} className="max-w-sm w-full flex flex-col items-start gap-8">
                <div className="bg-white p-8 hand-drawn-card shadow-lg relative">
                  <p className="font-bold italic text-dark-charcoal font-handwritten text-xl leading-snug">"{test.text}"</p>
                  <div className="absolute -bottom-3 left-10 w-6 h-6 bg-white border-b-2 border-r-2 border-dark-charcoal rotate-45"></div>
                </div>
                <div className="flex items-center gap-4 ml-8">
                  <div className={`size-16 hand-drawn-border ${test.color} overflow-hidden rotate-[-4deg]`}>
                    <img alt={test.name} className="w-full h-full object-cover grayscale mix-blend-multiply" src={`https://picsum.photos/100/100?face=${i}`} />
                  </div>
                  <div>
                    <p className="font-black text-lg font-display">{test.name}</p>
                    <p className="text-[10px] font-black uppercase text-berry tracking-widest">{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-menta/20 hand-drawn-card p-12 lg:p-20 text-center relative overflow-hidden border-4 border-dashed border-menta">
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral-soft opacity-20 organic-border -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-black mb-8 leading-tight font-display">¿Hacemos tu primer trato seguro hoy?</h2>
              <p className="text-xl font-bold text-dark-charcoal/70 mb-12 max-w-xl mx-auto font-handwritten">Únete a la comunidad donde la palabra vale mucho. ¡Es gratis empezar!</p>
              <Link to="/dashboard" className="inline-block bg-berry text-white text-2xl font-black px-12 py-6 rounded-full hand-drawn-border shadow-[8px_8px_0px_0px_rgba(16,34,24,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                ¡Entrar a mi Tablero! 🍬
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
