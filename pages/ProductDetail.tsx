
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useNotification } from '../App';

const ProgressStepper = ({ currentStepIdx = 0 }) => {
  const steps = [
    { label: 'Pactado', icon: 'handshake', desc: 'Acuerdo mutuo' },
    { label: 'Fondeado', icon: 'account_balance_wallet', desc: 'Dinero en cofre' },
    { label: 'Enviado', icon: 'local_shipping', desc: 'Paquete en viaje' },
    { label: 'Recibido', icon: 'package_2', desc: 'Control de calidad' },
    { label: 'Finalizado', icon: 'task_alt', desc: 'Trato exitoso' },
  ];

  return (
    <div className="w-full py-8 mb-12 bg-white/40 rounded-[3rem] border-2 border-dashed border-dark-charcoal/10 px-4 md:px-10 overflow-hidden">
      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Background Line */}
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full">
          <div 
            className="absolute top-0 left-0 h-full bg-menta transition-all duration-1000 rounded-full shadow-[0_0_15px_rgba(64,247,171,0.4)]" 
            style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIdx;
          const isCurrent = idx === currentStepIdx;
          const isUpcoming = idx > currentStepIdx;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center group">
              {/* Step Circle */}
              <div className={`
                size-12 md:size-16 rounded-blob border-3 border-dark-charcoal flex items-center justify-center transition-all duration-500 shadow-sm
                ${isCompleted ? 'bg-menta text-dark-charcoal rotate-[-12deg]' : ''}
                ${isCurrent ? 'bg-coral-soft text-dark-charcoal scale-110 md:scale-125 ring-8 ring-coral-soft/10 rotate-12 shadow-md' : ''}
                ${isUpcoming ? 'bg-white text-slate-300' : ''}
              `}>
                <span className="material-symbols-outlined text-xl md:text-2xl font-bold">
                  {isCompleted ? 'check' : step.icon}
                </span>
              </div>
              
              {/* Tooltip on Hover */}
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all pointer-events-none bg-dark-charcoal text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-xl whitespace-nowrap z-20">
                {step.desc}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-charcoal rotate-45"></div>
              </div>

              {/* Label */}
              <div className={`
                absolute -bottom-10 whitespace-nowrap text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-colors
                ${isCompleted ? 'text-menta-dark' : ''}
                ${isCurrent ? 'text-coral-soft animate-pulse' : ''}
                ${isUpcoming ? 'text-slate-300' : ''}
              `}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ShareModal = ({ isOpen, onClose, title }: { isOpen: boolean, onClose: () => void, title: string }) => {
  const { notify } = useNotification();
  const shareUrl = window.location.href;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    notify({
      type: 'success',
      title: '¡Enlace copiado! 📋',
      message: 'Ya puedes pegarlo donde quieras para compartir este tesoro.',
      icon: 'content_copy'
    });
    onClose();
  };

  if (!isOpen) return null;

  const socialLinks = [
    { name: 'WhatsApp', icon: 'chat', color: 'bg-[#25D366]', url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + shareUrl)}` },
    { name: 'X (Twitter)', icon: 'close', color: 'bg-black', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}` },
    { name: 'Facebook', icon: 'facebook', color: 'bg-[#1877F2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-dark-charcoal/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white hand-drawn-card p-10 max-w-sm w-full text-center rotate-1 border-4 border-dark-charcoal shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-dark-charcoal transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="size-20 bg-sky-soft/30 rounded-blob mx-auto mb-6 flex items-center justify-center border-3 border-dark-charcoal rotate-[-6deg]">
          <span className="material-symbols-outlined text-4xl text-sky-600">share</span>
        </div>

        <h3 className="text-2xl font-black font-display mb-2">¡Pasa la voz! 📢</h3>
        <p className="font-handwritten text-lg text-gray-500 mb-8 leading-tight italic">
          Ayuda a que este tesoro encuentre un nuevo hogar.
        </p>

        <div className="flex justify-center gap-4 mb-8">
          {socialLinks.map(social => (
            <a 
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`size-12 ${social.color} text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-md`}
              title={social.name}
            >
              <span className="material-symbols-outlined">{social.icon}</span>
            </a>
          ))}
        </div>

        <button 
          onClick={copyToClipboard}
          className="w-full py-4 bg-white text-dark-charcoal font-black rounded-full border-3 border-dark-charcoal shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl">link</span>
          Copiar Enlace
        </button>
      </div>
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [activeImg, setActiveImg] = useState(0);
  
  // States
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showButtonTooltip, setShowButtonTooltip] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Mock checking if this is an active deal or a product view
  // In a real app, we'd fetch the deal state here
  const currentStep = 0; // 0: Start, 1: Paid, 2: Shipped, etc.

  const product = {
    title: "MacBook Pro 14\" M2 Pro - Tu nueva estación creativa",
    price: 1899,
    oldPrice: 2199,
    savings: 300,
    rating: 4.8,
    reviewsCount: 42,
    category: "Tecnología",
    condition: "Como nuevo",
    description: "He cuidado esta laptop como si fuera parte de mi familia. Es potente, elegante y está lista para encontrar un nuevo hogar donde sigan creando cosas maravillosas con ella.",
    seller: {
      name: "Marcos G.",
      reputation: "9.8",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAprCH9bcS1CFcb-c9sJhbp3ZlpvMF3PdvPRuWyHRoE2x4l0NikMnNq2Ml8gLMYz2x1ClHS31sg2wxRcMZfcKCEJ08DRkDdkvR9p7cL946MRNT4cdLjJtUDYqatL6cBU87YthadUcI0vC4spJIj0lqWuCZyomOxTIBLThpkC6DbEozZFLPT_z_y5oggK1rfCb6deBndBy2dmrPPzhCndv0w3MUSTfm3MlXfVXOA1HieYoVFy2PgqMj_3SoLEXeghsv_tWsSQOksGRsW",
      deals: 152,
      responseTime: "Menos de 1h",
      yearsInPlatform: "4 años",
      status: "Socio de Oro",
      phrase: "Me encanta la tecnología y cuidar mis cosas"
    },
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCP6tYQcteeTSHJ7w_vmyDZiheDGksfngJR6_HxNfIKXRw4StRO_GoYqkY-RnxVeUhvD7H66mljIHTzwCzvPHvnscCq23oh7e1QAdiG_eQvdlA1v7fYhVrZS6I7kx-_Djx8T2I5g7-CpVE4m8z2AStZggNCty7t3oQVGaTfoqalDLeJogGKZMhLaTe4771wErJMYUj9Rg6PVkR6TvlpsBkYk0KDz69MoRJRiyiYhVwpkoxXbuAahdHZWix5ou7pIQlX5o8GFOFl0QTX",
      "https://picsum.photos/1200/900?tech=1",
      "https://picsum.photos/1200/900?tech=2",
      "https://picsum.photos/1200/900?tech=3"
    ]
  };

  // Dynamic Title and Favicon Update
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${product.title} | De Oportunidades`;

    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    const prevFavicon = link.href;
    link.href = product.images[0];
    document.getElementsByTagName('head')[0].appendChild(link);

    return () => {
      document.title = prevTitle;
      link.href = prevFavicon;
    };
  }, [product.title, product.images]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleStartDeal = () => {
    notify({
      type: 'info',
      title: '¡Excelente elección! 🎯',
      message: 'Te estamos llevando a crear el trato seguro para este tesoro.',
      icon: 'magic_button'
    });
    navigate('/new-trato', { 
      state: { 
        sellerName: product.seller.name, 
        sellerAvatar: product.seller.avatar, 
        productTitle: product.title, 
        productPrice: product.price 
      } 
    });
  };

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-10 relative">
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={product.title}
      />

      {/* Fullscreen Overlay */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 z-[100] bg-dark-charcoal/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-300"
          onClick={() => setShowFullscreen(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors border border-white/20"
            onClick={(e) => { e.stopPropagation(); setShowFullscreen(false); }}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img 
            src={product.images[activeImg]} 
            alt="Fullscreen View" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border-4 border-white/10"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <nav className="flex items-center gap-3 text-sm font-medium text-slate-500 mb-6">
        <Link to="/" className="hover:text-menta-dark flex items-center gap-1 transition-colors">Inicio</Link>
        <span className="material-symbols-outlined text-sm">trending_flat</span>
        <Link to="/search" className="hover:text-menta-dark transition-colors">{product.category}</Link>
        <span className="material-symbols-outlined text-sm">trending_flat</span>
        <span className="text-slate-900 font-bold italic">Tu próximo compañero</span>
      </nav>

      {/* NEW: Deal Progress Stepper */}
      <ProgressStepper currentStepIdx={currentStep} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Media */}
        <div className="lg:col-span-7 space-y-8">
          <div className="relative group">
            <div 
              ref={imageRef}
              className="aspect-[4/3] rounded-[3rem] overflow-hidden bg-white shadow-2xl border-4 border-white cursor-zoom-in relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setShowFullscreen(true)}
            >
              <img 
                className="w-full h-full object-cover transition-transform duration-500 ease-out" 
                src={product.images[activeImg]} 
                alt="Main Product" 
                style={{ 
                  transform: isHovered ? `scale(1.8)` : 'scale(1)',
                  transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                }}
              />
              
              {!isHovered && (
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg scale-90 group-hover:scale-100 transition-transform">
                      <span className="material-symbols-outlined text-xl">zoom_in</span>
                      <span className="text-xs font-black uppercase tracking-widest">Click para ver más</span>
                   </div>
                </div>
              )}
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-berry text-white px-6 py-2 rounded-full font-display font-bold shadow-lg rotate-[-2deg] border-2 border-white">
              ¡Impecable! ✨
            </div>

            {/* Floating Share Button on image for mobile or context */}
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="absolute top-6 right-6 size-12 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center text-dark-charcoal border-3 border-dark-charcoal shadow-lg hover:bg-menta transition-all lg:hidden"
            >
              <span className="material-symbols-outlined">share</span>
            </button>
          </div>

          <div className="flex gap-4 justify-center">
            {product.images.map((img, idx) => (
              <div 
                key={idx} 
                onClick={() => setActiveImg(idx)} 
                className={`size-20 rounded-2xl overflow-hidden cursor-pointer border-4 transition-all hover:scale-110 active:scale-95 ${activeImg === idx ? 'border-menta rotate-2 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img className="w-full h-full object-cover" src={img} alt={`Thumbnail ${idx}`} />
              </div>
            ))}
          </div>

          <div className="paper-texture p-10 rounded-[2.5rem] shadow-inner border border-slate-200 rotate-[0.5deg]">
            <h3 className="font-display font-bold text-2xl mb-4 text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-coral-soft">auto_awesome</span>
              Sobre esta joya
            </h3>
            <p className="font-hand text-2xl text-slate-700 leading-relaxed italic">"{product.description}"</p>
          </div>
        </div>

        {/* Right Column: Buying Info & Seller Information */}
        <div className="lg:col-span-5 space-y-8">
          <div className="sticky top-28 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-menta/10 organic-border -z-0"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="inline-block px-4 py-1.5 bg-menta/20 text-menta-dark rounded-full text-xs font-bold uppercase">💎 Objeto Único</span>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="hidden lg:flex items-center gap-2 text-slate-400 hover:text-berry font-bold text-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">share</span>
                  Compartir
                </button>
              </div>

              <h1 className="text-3xl font-bold font-display leading-tight mb-4 relative z-10">{product.title}</h1>
              
              <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] flex items-center justify-between border-2 border-dashed border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Precio del trato</p>
                  <p className="text-5xl font-bold text-slate-900">${product.price}</p>
                </div>
                <div className="bg-primary organic-border p-4 rotate-6 text-dark-charcoal font-bold shadow-md">
                   <p className="text-xs">Ahorras</p>
                   <p className="text-xl">${product.savings}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 bg-sky-soft/20 p-4 rounded-2xl">
                  <span className="material-symbols-outlined text-sky-600">verified</span>
                  <span>Trato protegido por nuestro cofre mágico. El vendedor recibe el dinero solo cuando confirmes.</span>
                </div>
              </div>

              <div className="relative">
                {showButtonTooltip && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-full max-w-[200px] bg-dark-charcoal text-white text-[12px] font-black py-2 px-4 rounded-2xl hand-drawn-border border-2 border-white shadow-lg animate-bounce-short z-20 text-center uppercase tracking-widest flex flex-col items-center">
                    Empieza tu compra protegida
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-dark-charcoal"></div>
                  </div>
                )}
                <button 
                  onClick={handleStartDeal} 
                  onMouseEnter={() => setShowButtonTooltip(true)}
                  onMouseLeave={() => setShowButtonTooltip(false)}
                  className="w-full bg-menta py-6 rounded-full text-slate-900 font-bold text-xl hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-menta/30 flex items-center justify-center gap-3 border-b-8 border-menta-dark"
                >
                  <span className="material-symbols-outlined text-3xl font-black">handshake</span>
                  ¡Iniciar Trato Seguro!
                </button>
              </div>
            </div>

            {/* Seller Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-6">
                <span className="material-symbols-outlined text-coral-soft">person_pin</span>
                <h3 className="font-display font-bold text-xl">Conoce a quien vende</h3>
              </div>
              
              <div className="hand-drawn-card p-8 bg-papel relative group transition-all hover:-translate-y-1">
                <div className="absolute -top-3 -right-2 bg-dark-charcoal text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 border-white shadow-md z-10">
                  {product.seller.status}
                </div>
                
                <div className="flex items-center gap-5 mb-8">
                  <Link to="/profile" className="size-20 organic-border bg-menta p-1 shadow-md transition-transform group-hover:rotate-12 flex-shrink-0">
                    <img className="w-full h-full object-cover organic-border" src={product.seller.avatar} alt="Seller Avatar" />
                  </Link>
                  <div className="flex-1">
                    <Link to="/profile" className="block font-bold text-2xl font-display leading-tight hover:text-menta-dark transition-colors">
                      {product.seller.name}
                    </Link>
                    <p className="font-hand text-xl leading-none text-slate-500 mt-1">"{product.seller.phrase}"</p>
                    <div className="flex items-center gap-1 mt-2">
                       {[...Array(5)].map((_, i) => (
                         <span key={i} className={`material-symbols-outlined text-sm ${i < 4 ? 'text-yellow-400 fill-1' : 'text-slate-300'}`}>star</span>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white p-4 rounded-3xl text-center border-2 border-dark-charcoal/5 shadow-sm group-hover:border-menta/30 transition-colors">
                    <p className="text-3xl font-display font-black text-menta-dark">{product.seller.reputation}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Score Palabra</p>
                  </div>
                  <div className="bg-white p-4 rounded-3xl text-center border-2 border-dark-charcoal/5 shadow-sm group-hover:border-coral-soft/30 transition-colors">
                    <p className="text-3xl font-display font-black text-dark-charcoal">{product.seller.deals}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tratos Épicos</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t-2 border-dashed border-dark-charcoal/10">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <span className="material-symbols-outlined text-lg">calendar_today</span>
                      <span>En la plataforma</span>
                    </div>
                    <span className="font-black text-dark-charcoal">{product.seller.yearsInPlatform}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-500 font-bold">
                      <span className="material-symbols-outlined text-lg">bolt</span>
                      <span>Responde en</span>
                    </div>
                    <span className="font-black text-emerald-500">{product.seller.responseTime}</span>
                  </div>
                </div>

                <Link 
                  to="/profile" 
                  className="mt-8 w-full py-4 rounded-2xl bg-white border-2 border-dark-charcoal text-dark-charcoal font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-dark-charcoal hover:text-white transition-all shadow-[4px_4px_0px_rgba(16,34,24,1)] active:shadow-none active:translate-y-1"
                >
                  Ver perfil completo
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
