
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../lib/auth';
import { startChat } from '../../lib/chat';

// Hooks
import { useProduct } from '../../hooks/useProduct';
import { useNotification } from '../../context/NotificationContext';

// Components
import ShareModal from '../../components/product/ShareModal';
import SellerSection from '../../components/product/SellerSection';
import ProductMedia from '../../components/product/ProductMedia';
import QuestionsSection from '../../components/product/QuestionsSection';
import ProductActions from '../../components/product/ProductActions';
import SellerStoreBanner from '../../components/product/SellerStoreBanner';

import { toggleFavorite, checkIsFavorite, toggleProductAlert, checkHasAlert, reportItem } from '../../lib/interactions';
import { trackProductView } from '../../lib/users';
import ReportModal from '../../components/product/ReportModal';
import { useCart } from '../../context/CartContext';

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
    handleMouseMove
  } = useProduct();

  const navigate = useNavigate();

  const { user } = useAuth();
  const { notify } = useNotification();
  const { addToCart } = useCart();
  const [offerAmount, setOfferAmount] = useState('');

  // Mock states for actions -> Real states
  const [isSaved, setIsSaved] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Check initial state & Track View
  useEffect(() => {
    if (user && product.id) {
      checkIsFavorite(user.uid, product.id).then(setIsSaved);
      checkHasAlert(user.uid, product.id).then(setHasAlert);

      // Track behavior
      trackProductView(user.uid, product.id, product.category);
    }
  }, [user, product.id, product.category]);

  const handleAction = async (action: string) => {
    if (!user) {
      notify({ type: 'error', title: 'Acceso Denegado', message: 'Inicia sesión para usar esta función.', icon: 'lock' });
      return;
    }

    switch (action) {
      case 'save':
        try {
          const { isFavorite } = await toggleFavorite(user.uid, product.id);
          setIsSaved(isFavorite);
          notify({ type: 'success', title: isFavorite ? 'Guardado' : 'Removido', message: isFavorite ? 'Producto añadido a favoritos.' : 'Producto eliminado de favoritos.', icon: 'favorite' });
        } catch (e) {
          notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar favoritos.', icon: 'error' });
        }
        break;
      case 'alert':
        try {
          const { hasAlert } = await toggleProductAlert(user.uid, product.id);
          setHasAlert(hasAlert);
          notify({ type: 'success', title: hasAlert ? 'Alerta Activada' : 'Alerta Desactivada', message: hasAlert ? 'Te notificaremos cambios en este producto.' : 'Ya no recibirás notificaciones de este producto.', icon: 'notifications' });
        } catch (e) {
          notify({ type: 'error', title: 'Error', message: 'No se pudo actualizar la alerta.', icon: 'error' });
        }
        break;
      case 'report':
        setIsReportModalOpen(true);
        break;
    }
  };

  const handleReportSubmit = async (reason: string, description: string) => {
    if (!user) return;

    const result = await reportItem({
      reporterId: user.uid,
      reporterName: user.displayName || user.email || 'Usuario Anónimo',
      targetId: product.id,
      targetType: 'product',
      reason,
      description
    });

    if (result.success) {
      notify({ type: 'success', title: 'Reporte Recibido', message: 'Gracias. Nuestro equipo revisará el caso.', icon: 'verified_user' });
    } else {
      notify({ type: 'error', title: 'Error', message: 'No se pudo enviar el reporte.', icon: 'error' });
    }
  };

  const handleSendOffer = () => {
    if (!offerAmount) return;
    notify(`Oferta de $${offerAmount} enviada al vendedor`, 'success');
    setOfferAmount('');
  };

  const handleContactSeller = async () => {
    if (!user) {
      notify({ type: 'error', title: 'Acceso Denegado', message: 'Inicia sesión para contactar al vendedor.', icon: 'lock' });
      return;
    }
    if (user.uid === product.seller.id) {
      notify({ type: 'warning', title: 'Es tu producto', message: 'No puedes enviarte mensajes a ti mismo.', icon: 'person' });
      return;
    }

    try {
      const chatId = await startChat(user.uid, product.seller.id, {
        displayName: product.seller.name || 'Vendedor',
        photoURL: product.seller.image || `https://ui-avatars.com/api/?name=${product.seller.name || 'V'}&background=random`
      });
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error("Error contact seller:", error);
      notify({ type: 'error', title: 'Error', message: 'No se pudo iniciar el chat.', icon: 'error' });
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      notify({ type: 'error', title: 'Acceso Denegado', message: 'Inicia sesión para comprar.', icon: 'lock' });
      return;
    }
    navigate(`/checkout`, {
      state: {
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        sellerName: product.seller.displayName || product.seller.name,
        sellerAvatar: product.seller.avatar,
        sellerId: product.seller.id,
        deliveryMethods: product.deliveryMethods || ['en_mano'],
        productImage: product.images[0],
        isFeatured: product.isFeatured,
        featuredUntil: product.featuredUntil,
        featuredFeeApplied: product.featuredFeeApplied
      }
    });
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0],
      sellerId: product.seller.id,
      sellerName: product.seller.displayName || product.seller.name
    });
  };

  // JSON-LD schema for rich search results
  const getJsonLd = () => {
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.title,
      "image": product.images || [],
      "description": product.description,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Unspecified"
      },
      "offers": {
        "@type": "Offer",
        "url": window.location.href,
        "priceCurrency": "ARS",
        "price": product.price,
        "itemCondition": product.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": product.seller.displayName || product.seller.name || "Vendelo Ya User"
        }
      }
    };
  };

  return (
    <main className="max-w-[1280px] mx-auto px-3 py-3 lg:px-6 lg:py-6 bg-light-50 min-h-screen">
      <Helmet>
        <title>{`${product.title} | Vendelo Ya!`}</title>
        <meta name="description" content={product.description.substring(0, 150) + '...'} />
        <meta property="og:title" content={`${product.title} - $${product.price.toLocaleString()}`} />
        <meta property="og:description" content={product.description.substring(0, 100) + '...'} />
        {product.images?.[0] && <meta property="og:image" content={product.images[0]} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify(getJsonLd())}
        </script>
      </Helmet>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={product.title}
      />
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
        targetName={product.title}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 lg:mb-6">
        <Link to="/" className="hover:text-primary-vibrant transition-colors">Inicio</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link to="/search" className="hover:text-primary-vibrant transition-colors">{product.category}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-dark-800">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8">
        {/* IMAGE GALLERY - order-1: always first */}
        <div className="lg:col-span-8 order-1">
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
        </div>

        {/* PURCHASING HUB - order-2 on mobile (right below image), stays in right column on desktop */}
        <div className="lg:col-span-4 lg:row-span-2 order-2 h-full">
          <div className="lg:sticky lg:top-24 space-y-3 lg:space-y-6">
            <ProductActions
              onSave={() => handleAction('save')}
              onAlert={() => handleAction('alert')}
              onReport={() => handleAction('report')}
              onShare={() => setIsShareModalOpen(true)}
              isSaved={isSaved}
              hasAlert={hasAlert}
            />

            <div className="bg-white p-4 lg:p-8 rounded-2xl lg:rounded-3xl border border-light-200 shadow-premium">
              <div className="mb-3 lg:mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h1 className="text-lg lg:text-2xl font-black text-dark-800 leading-tight bg-gradient-to-br from-dark-800 to-dark-600 bg-clip-text text-transparent">{product.title}</h1>
                  <button className="text-gray-400 hover:text-red-500 transition-colors">
                    <span className="material-symbols-outlined" onClick={() => handleAction('save')}>{isSaved ? 'favorite' : 'favorite_border'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between mb-3 lg:mb-6">
                  <div className="flex items-baseline gap-3">
                    <p className="text-2xl lg:text-4xl font-black text-dark-800 tracking-tight">${product.price.toLocaleString()}</p>
                    {product.oldPrice && product.oldPrice > product.price && (
                      <p className="text-sm lg:text-xl font-bold text-gray-400 line-through opacity-60">
                        ${product.oldPrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                  {product.views && product.views > 10 && (
                    <div className="flex items-center gap-1.5 bg-light-100/50 px-2.5 py-1.5 lg:px-4 lg:py-2 rounded-full border border-light-200 shadow-sm animate-in fade-in slide-in-from-right-2">
                      <span className="material-symbols-outlined text-sm text-gray-400">visibility</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {product.views} visitas
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:gap-3 mb-3 lg:mb-6">
                <div className="grid grid-cols-2 gap-2 lg:gap-3">
                  <button
                    onClick={handleBuyNow}
                    className="bg-primary-vibrant text-white py-3 lg:py-5 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.15em] lg:tracking-[0.2em] hover:bg-primary-600 transition-all flex items-center justify-center gap-1.5 lg:gap-2 shadow-lg shadow-primary-500/30 active:scale-95 group"
                  >
                    <span className="material-symbols-outlined text-base lg:text-lg group-hover:scale-110 transition-transform">bolt</span>
                    Comprar Ya
                  </button>
                  <button
                    onClick={handleContactSeller}
                    className="bg-white text-dark-800 border-2 border-light-200 py-3 lg:py-5 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.15em] lg:tracking-[0.2em] hover:bg-light-50 transition-all flex items-center justify-center gap-1.5 lg:gap-2 active:scale-95 group"
                  >
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary-vibrant transition-colors text-base lg:text-lg">chat</span>
                    Mensaje
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-light-100/50 hover:bg-light-100 text-dark-800 py-3 lg:py-5 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.15em] lg:tracking-[0.2em] transition-all flex items-center justify-center gap-1.5 lg:gap-2 active:scale-95 group"
                >
                  <span className="material-symbols-outlined text-base lg:text-lg group-hover:rotate-12 transition-transform">add_shopping_cart</span>
                  Agregar al Carrito
                </button>
              </div>

              <div className="border-t border-light-100 pt-4 lg:pt-8 mb-4 lg:mb-8">
                <h4 className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 lg:mb-6">Detalles</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-3 lg:gap-x-4 lg:gap-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Condición</p>
                    <p className="text-sm font-bold text-dark-800 capitalize">
                      {product.condition === 'new' ? 'Nuevo' :
                        product.condition === 'like_new' ? 'Como Nuevo' :
                          product.condition === 'good' ? 'Bueno' : 'Regular'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marca</p>
                    <p className="text-sm font-bold text-dark-800">{product.brand || 'No especificada'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Color</p>
                    <p className="text-sm font-bold text-dark-800">{product.color || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Categoría</p>
                    <p className="text-sm font-bold text-dark-800">{product.category}</p>
                  </div>
                </div>

                {product.deliveryMethods && product.deliveryMethods.length > 0 && (
                  <div className="mt-4 pt-4 lg:mt-8 lg:pt-8 border-t border-light-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Opciones de Entrega</p>
                    <div className="space-y-2 lg:space-y-3">
                      {product.deliveryMethods.map((m: string) => {
                        const methodMap: Record<string, { label: string, icon: string }> = {
                          'correo_argentino': { label: 'Correo Argentino', icon: 'local_shipping' },
                          'en_mano': { label: 'En mano (Persona a persona)', icon: 'handshake' },
                          'acordar': { label: 'Acordar con vendedor', icon: 'chat' },
                          'domicilio': { label: 'Envío a domicilio', icon: 'home' }
                        };
                        const method = methodMap[m] || { label: m, icon: 'package' };
                        return (
                          <div key={m} className="flex items-center gap-2 lg:gap-3 p-2 lg:p-3 bg-light-50 rounded-lg lg:rounded-xl border border-light-200/50">
                            <span className="material-symbols-outlined text-primary-vibrant text-lg">{method.icon}</span>
                            <span className="text-[11px] font-black text-dark-800 uppercase tracking-tight">{method.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <SellerSection seller={product.seller} />

              <div className="mt-4 lg:mt-6 bg-primary-50 rounded-xl lg:rounded-2xl p-3 lg:p-5 border border-primary-100 flex gap-3 lg:gap-4">
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

        {/* DESCRIPTION & MORE - order-3 on mobile (below purchase card), part of left column on desktop */}
        <div className="lg:col-span-8 space-y-6 lg:space-y-10 order-3">
          <div className="p-4 lg:p-8 bg-white border border-light-200 rounded-2xl lg:rounded-3xl shadow-premium">
            <h3 className="text-xs lg:text-sm font-black uppercase tracking-widest text-dark-800 mb-4 lg:mb-8 flex items-center gap-2 lg:gap-3">
              <span className="material-symbols-outlined text-primary-vibrant">subject</span>
              Descripción
            </h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-sm lg:text-lg font-bold text-dark-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="mt-6 lg:mt-12 grid grid-cols-2 gap-4 lg:gap-8 border-t border-light-100 pt-6 lg:pt-10">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="size-9 lg:size-12 rounded-xl lg:rounded-2xl bg-light-100 flex items-center justify-center text-dark-800">
                  <span className="material-symbols-outlined text-lg lg:text-2xl">stars</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Condición</p>
                  <p className="text-xs lg:text-base font-black text-dark-800 capitalize">{product.condition === 'like_new' ? 'Usado - Excelente' : 'Usado - Bueno'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="size-9 lg:size-12 rounded-xl lg:rounded-2xl bg-light-100 flex items-center justify-center text-dark-800">
                  <span className="material-symbols-outlined text-lg lg:text-2xl">location_on</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-0.5">Ubicación</p>
                  <p className="text-xs lg:text-base font-black text-dark-800">{product.location || 'Buenos Aires, AR'}</p>
                </div>
              </div>
            </div>
          </div>

          <SellerStoreBanner
            sellerId={product.seller.id}
            sellerName={product.seller.displayName || product.seller.name}
            sellerAvatar={product.seller.avatar || product.seller.image}
          />

          <QuestionsSection itemId={product.id} sellerId={product.seller.id} itemTitle={product.title} />
        </div>
      </div>

    </main>
  );
};

export default ProductDetail;
