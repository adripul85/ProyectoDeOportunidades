
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

// Hooks
import { useProduct } from '../../hooks/useProduct';
import { useNotification } from '../../App';

// Components
import ShareModal from '../../components/product/ShareModal';
import SellerSection from '../../components/product/SellerSection';
import ProductMedia from '../../components/product/ProductMedia';
import QuestionsSection from '../../components/product/QuestionsSection';
import ProductActions from '../../components/product/ProductActions';

const ProductDetail = () => {
  const {
    product,
    activeImg,
    setActiveImg,
    isHovered,
    setIsHovered,
    mousePos,
    showFullscreen,
    setShowFullscreen,
    isShareModalOpen,
    setIsShareModalOpen,
    imageRef,
    handleMouseMove,
    startDeal
  } = useProduct();

  const { user } = useAuth();
  const { notify } = useNotification();
  const [offerAmount, setOfferAmount] = useState('');

  // Mock states for actions
  const [isSaved, setIsSaved] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);

  // Dynamic Title Update
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${product.title} | MarketTrust`;
    return () => { document.title = prevTitle; };
  }, [product.title]);

  const handleAction = (action: string) => {
    if (!user) {
      notify('Inicia sesión para usar esta función', 'error');
      return;
    }

    switch (action) {
      case 'save':
        setIsSaved(!isSaved);
        notify(isSaved ? 'Eliminado de favoritos' : 'Guardado en favoritos', 'success');
        break;
      case 'alert':
        setHasAlert(!hasAlert);
        notify(hasAlert ? 'Alerta desactivada' : 'Te avisaremos si baja de precio', 'success');
        break;
      case 'report':
        notify('Gracias. Revisaremos esta publicación.', 'success');
        break;
    }
  };

  const handleSendOffer = () => {
    if (!user) {
      notify('Debes iniciar sesión para ofertar', 'error');
      return;
    }
    if (!offerAmount) return;
    notify(`Oferta de $${offerAmount} enviada al vendedor`, 'success');
    setOfferAmount('');
  };

  return (
    <main className="max-w-[1440px] mx-auto px-6 py-10 bg-light-50 min-h-screen">
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={product.title}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-10">
        <Link to="/" className="hover:text-primary-vibrant transition-colors">Inicio</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link to="/search" className="hover:text-primary-vibrant transition-colors">{product.category}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-dark-800">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* MEDIA & INFO (Left) */}
        <div className="lg:col-span-8 space-y-10">
          <ProductMedia
            images={product.images}
            activeImg={activeImg}
            setActiveImg={setActiveImg}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
            mousePos={mousePos}
            onMouseMove={handleMouseMove}
            onFullscreen={() => setShowFullscreen(true)}
            onShare={() => setIsShareModalOpen(true)}
            imageRef={imageRef}
          />

          <div className="p-10 bg-white border border-light-200 rounded-4xl shadow-premium">
            <h3 className="text-sm font-black uppercase tracking-widest text-dark-800 mb-8 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-vibrant">subject</span>
              Descripción
            </h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-lg font-bold text-dark-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-8 border-t border-light-100 pt-10">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-light-100 flex items-center justify-center text-dark-800">
                  <span className="material-symbols-outlined">stars</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Condición</p>
                  <p className="font-black text-dark-800 capitalize">{product.condition === 'like_new' ? 'Usado - Excelente' : 'Usado - Bueno'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-light-100 flex items-center justify-center text-dark-800">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Ubicación</p>
                  <p className="font-black text-dark-800">Buenos Aires, AR</p>
                </div>
              </div>
            </div>
          </div>

          <QuestionsSection itemId={product.id} sellerId={product.seller.id} />
        </div>

        {/* PURCHASING HUB (Right) */}
        <div className="lg:col-span-4 space-y-6">
          <ProductActions
            onSave={() => handleAction('save')}
            onAlert={() => handleAction('alert')}
            onReport={() => handleAction('report')}
            onShare={() => setIsShareModalOpen(true)}
            isSaved={isSaved}
            hasAlert={hasAlert}
          />

          <div className="bg-white p-8 rounded-4xl border border-light-200 shadow-premium sticky top-28">
            <div className="mb-6">
              <h1 className="text-3xl font-black mb-2 text-dark-800 leading-tight">{product.title}</h1>
              <p className="text-sm font-bold text-gray-400 mb-6">Publicado hace 2 días en Buenos Aires, AR</p>
              <p className="text-4xl font-black text-dark-800 tracking-tight">${product.price.toLocaleString()}</p>
            </div>

            <div className="space-y-3 mb-8">
              <button
                onClick={startDeal}
                className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-base hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-primary-500/10"
              >
                <span className="material-symbols-outlined">chat_bubble</span>
                Mensaje al Vendedor
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-secondary !py-3 !px-4 !rounded-2xl !text-xs">
                  <span className="material-symbols-outlined text-lg">favorite</span>
                  Guardar
                </button>
                <button className="btn-secondary !py-3 !px-4 !rounded-2xl !text-xs">
                  <span className="material-symbols-outlined text-lg">share</span>
                  Compartir
                </button>
              </div>
            </div>

            <div className="border-t border-light-100 pt-8 mb-8">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Detalles</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Condición</p>
                  <p className="text-sm font-bold text-dark-800">Usado - Excelente</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marca</p>
                  <p className="text-sm font-bold text-dark-800">Apple</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Color</p>
                  <p className="text-sm font-bold text-dark-800">Silver</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Categoría</p>
                  <p className="text-sm font-bold text-dark-800">{product.category}</p>
                </div>
              </div>
            </div>

            <SellerSection seller={product.seller} />

            <div className="mt-6 bg-primary-50 rounded-2xl p-5 border border-primary-100 flex gap-4">
              <span className="material-symbols-outlined text-primary-vibrant">verified_user</span>
              <div>
                <h5 className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-1">Consejos de Seguridad</h5>
                <ul className="text-[10px] font-bold text-primary-800/70 space-y-1 list-disc pl-3">
                  <li>Encuéntrese en un lugar público y bien iluminado</li>
                  <li>Inspeccione el artículo antes de pagar</li>
                  <li>Nunca envíe dinero por transferencia bancaria directa</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
