
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const navigate = useNavigate();
  
  const handleStartDeal = () => {
    navigate('/new-trato', { 
      state: { 
        sellerName: 'Juan Pérez', 
        sellerAvatar: 'https://picsum.photos/400/400?person=1' 
      } 
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto w-full px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="bg-white hand-drawn-card p-10 relative overflow-hidden">
            <div className="absolute top-4 right-4 rotate-[15deg] opacity-20">
              <span className="material-symbols-outlined text-8xl">local_post_office</span>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="relative">
                <div className="aspect-square rounded-2xl border-4 border-dark-charcoal h-40 w-40 overflow-hidden rotate-[-2deg] shadow-lg">
                  <img alt="User" className="w-full h-full object-cover" src="https://picsum.photos/400/400?person=1" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white border-2 border-dark-charcoal rounded-full p-2 rotate-[10deg] shadow-md">
                  <span className="material-symbols-outlined text-coral-soft fill-1">favorite</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-4xl font-bold font-display">¡Hola! Soy Juan Pérez</h1>
                  <span className="material-symbols-outlined text-primary-mint text-3xl">stars</span>
                </div>
                <p className="font-handwritten text-2xl text-gray-600 mb-4">"Construyendo confianza, un trato a la vez."</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                  <div className="flex items-center gap-2 bg-mint-soft/30 px-4 py-2 rounded-full border-2 border-dark-charcoal rotate-[-1deg]">
                    <span className="material-symbols-outlined text-dark-charcoal text-sm">location_on</span>
                    <span className="text-sm font-bold uppercase tracking-wide">Ciudad de México, MX</span>
                  </div>
                  <div className="flex items-center gap-2 bg-coral-soft/30 px-4 py-2 rounded-full border-2 border-dark-charcoal rotate-[1deg]">
                    <span className="material-symbols-outlined text-dark-charcoal text-sm">verified_user</span>
                    <span className="text-sm font-bold uppercase tracking-wide">Identidad Verificada</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white hand-drawn-card p-10 flex flex-col md:flex-row items-center gap-12">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="text-center">
                <span className="material-symbols-outlined text-8xl text-primary-mint drop-shadow-md">potted_plant</span>
                <div className="absolute inset-0 flex items-center justify-center mt-[-20px]">
                  <div className="bg-white border-2 border-dark-charcoal px-3 py-1 rounded-full rotate-[-5deg] shadow-sm">
                    <span className="text-3xl font-black">98</span>
                  </div>
                </div>
                <div className="flex gap-1 justify-center mt-2">
                  {[1, 2, 3].map(i => <span key={i} className="material-symbols-outlined text-coral-soft fill-1 text-xl">star</span>)}
                </div>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-4 font-display">Mi Score de Palabra</h3>
              <p className="text-gray-600 mb-6 font-medium leading-relaxed">
                Mi reputación es como una planta: la cuido todos los días cumpliendo mis promesas. ¡Actualmente está floreciendo con un nivel <span className="text-primary-mint font-bold underline">Excelente</span>!
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { val: '152', label: 'Tratos' },
                  { val: '3 años', label: 'Unido' },
                  { val: '< 1h', label: 'Respuesta' }
                ].map((stat, i) => (
                  <div key={i} className={`text-center p-3 bg-lemon-soft rounded-xl border-2 border-dark-charcoal rotate-[${i % 2 === 0 ? '-2' : '1'}deg]`}>
                    <div className="text-sm font-bold">{stat.val}</div>
                    <div className="text-[10px] uppercase font-bold text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-coral-soft">forum</span>
              Cartelera de Reseñas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: 'Roberto G.', color: 'bg-mint-soft', text: '¡Increíble experiencia! El MacBook está impecable. Juan es súper puntual.', time: 'Hace 2 días' },
                { name: 'TechCorp S.A.', color: 'bg-coral-soft', text: 'Consultoría IT de primer nivel. Entendió todo a la primera.', time: 'Hace 1 semana' }
              ].map((rev, i) => (
                <div key={i} className={`${rev.color} p-6 hand-drawn-card relative rotate-[${i % 2 === 0 ? '-1' : '1'}deg]`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex text-dark-charcoal opacity-60">
                      {[1, 2, 3, 4, 5].map(s => <span key={s} className="material-symbols-outlined text-sm">star</span>)}
                    </div>
                    <span className="text-[10px] font-bold uppercase">{rev.time}</span>
                  </div>
                  <p className="font-handwritten text-lg leading-tight mb-4 text-dark-charcoal/80">"{rev.text}"</p>
                  <div className="flex items-center gap-2 border-t border-dark-charcoal/20 pt-4">
                    <span className="font-display font-bold text-sm">- {rev.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-primary-coral text-white hand-drawn-card p-8 rotate-[1deg]">
            <h3 className="text-2xl font-bold mb-4 font-display">¿Hacemos un trato?</h3>
            <p className="mb-8 font-medium opacity-90 text-sm leading-relaxed">Iniciar un trato con Juan es seguro y transparente. ¡Confianza garantizada!</p>
            <button 
              onClick={handleStartDeal}
              className="w-full bg-white text-dark-charcoal font-display font-bold py-4 rounded-2xl border-2 border-dark-charcoal hover:bg-primary-mint transition-colors flex items-center justify-center gap-3 shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[4px]"
            >
              <span className="material-symbols-outlined">handshake</span>
              Iniciar Trato
            </button>
          </div>
          
          <div className="bg-white hand-drawn-card p-8 rotate-[-1deg] relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-berry">auto_awesome</span>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Mis Especialidades</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'Tecnología', color: 'bg-mint-soft', rotation: 'rotate-[2deg]' },
                { name: 'Hardware', color: 'bg-coral-soft', rotation: 'rotate-[-3deg]' },
                { name: 'Consultoría', color: 'bg-sky-soft', rotation: 'rotate-[1deg]' },
                { name: 'Gaming', color: 'bg-lemon-soft', rotation: 'rotate-[-2deg]' },
                { name: 'Soporte', color: 'bg-mint-soft', rotation: 'rotate-[3deg]' }
              ].map((tag, i) => (
                <span 
                  key={i} 
                  className={`
                    px-5 py-2.5 
                    ${tag.color} 
                    ${tag.rotation}
                    hand-drawn-border 
                    text-sm font-black 
                    cursor-default
                    transition-all duration-300
                    hover:scale-110 hover:rotate-0 hover:z-10
                    shadow-[2px_2px_0px_rgba(68,68,68,0.2)]
                    hover:shadow-[4px_4px_0px_rgba(68,68,68,0.4)]
                  `}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white hand-drawn-card p-8 rotate-[1deg]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Mis Sellos de Veracidad</h3>
            <div className="space-y-4">
              {[
                { label: 'Identidad Verificada', icon: 'verified_user' },
                { label: 'Email Confirmado', icon: 'mail' },
                { label: 'Teléfono Validado', icon: 'smartphone' }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary-mint">{badge.icon}</span>
                  <span className="font-bold text-sm">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
