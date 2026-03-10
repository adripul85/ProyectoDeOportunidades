import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../lib/auth';
import { createTransaction, PaymentMethod } from '../../lib/transactions';
import { subscribeToProduct } from '../../lib/items';
import { httpsCallable } from 'firebase/functions'; // Use Firebase Cloud Functions
import { functions } from '../../lib/firebase';
import PaymentMethodSelector from '../../components/checkout/PaymentMethodSelector';
import { useCart } from '../../context/CartContext';
import { getPlatformSettings, PlatformSettings } from '../../lib/settings';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const { cart, total: cartTotal, clearCart } = useCart(); // Added clearCart
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MERCADO_PAGO');
  const [deliveryMethod, setDeliveryMethod] = useState<'correo_argentino' | 'en_mano' | 'acordar' | 'domicilio'>('en_mano');
  const [shippingAvailable, setShippingAvailable] = useState<boolean>(true); // Default true until fetched
  const [notes, setNotes] = useState<string>('');

  // Derive checkout data from state or cart
  const state = location.state || {};
  const queryParams = new URLSearchParams(location.search);
  const resumedTxId = queryParams.get('tx') || state.transactionId;

  const [isResuming, setIsResuming] = useState(!!resumedTxId);
  const [resumedTxData, setResumedTxData] = useState<any>(null);

  const isCartMode = !state.productId && cart.length > 0 && !resumedTxId;

  const productId = state.productId || (isCartMode ? `cart-${Date.now()}` : resumedTxData?.itemId || null);
  const productTitle = state.productTitle || (isCartMode ? `Pedido de Carrito (${cart.length} items)` : resumedTxData?.itemTitle || '');
  const productPrice = state.productPrice || (isCartMode ? cartTotal : resumedTxData?.amount || 0);
  const sellerId = state.sellerId || (isCartMode ? cart[0]?.sellerId : resumedTxData?.sellerId || '');
  const sellerName = state.sellerName || (isCartMode ? cart[0]?.sellerName : resumedTxData?.sellerName || '');

  const [isDeleted, setIsDeleted] = useState(false);
  const [showModoModal, setShowModoModal] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(resumedTxId || null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);

  // Initial Fetch if Resuming
  React.useEffect(() => {
    getPlatformSettings().then(setPlatformSettings);
    if (resumedTxId) {
      setLoading(true);
      import('../../lib/transactions').then(({ getTransaction }) => {
        getTransaction(resumedTxId).then(tx => {
          if (tx && tx.status === 'PENDING_PAYMENT') {
            setResumedTxData(tx);
            if (tx.deliveryMethod) setDeliveryMethod(tx.deliveryMethod);
            if (tx.paymentMethod) setSelectedMethod(tx.paymentMethod);
          } else {
            notify({ type: 'error', title: 'Error de Sesión', message: 'Esta transacción ya no está disponible para pago.', icon: 'error' });
            navigate('/dashboard');
          }
          setLoading(false);
        });
      });
    }
  }, [resumedTxId, navigate, notify]);

  React.useEffect(() => {
    // Only subscribe to product updates if it's a real single product, not a virtual cart ID or resuming
    if (productId && !productId.startsWith('cart-') && !isResuming) {
      // Subscribe to real-time updates
      const unsubscribePromise = subscribeToProduct(productId, (item) => {
        if (!item) {
          // If item returns null, it has been deleted
          setIsDeleted(true);
          notify({ type: 'error', title: 'Producto No Disponible', message: 'El vendedor ha eliminado este producto o pausado la venta.', icon: 'production_quantity_limits' });
          setTimeout(() => navigate('/'), 2000);
        } else {
          if (item.shippingAvailable !== undefined) {
            setShippingAvailable(item.shippingAvailable);
            if (!item.shippingAvailable) setDeliveryMethod('en_mano');
          }
        }
      });

      return () => { unsubscribePromise.then(unsub => unsub()); };
    }
  }, [productId, navigate, notify, isResuming]);

  if (!productId && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-50">
        <div className="text-center">
          <div className="bg-light-100 size-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-gray-200 font-black">shopping_cart_off</span>
          </div>
          <h3 className="text-2xl font-black text-dark-800 mb-2 uppercase tracking-tight">Carrito Vacío</h3>
          <p className="text-sm font-bold text-gray-400 mb-10">No se detectaron activos para adquisición.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Explorar el Mercado
          </button>
        </div>
      </div>
    );
  }

  // NEW MODEL: Dynamic Fees from Settings
  const escrowFeePercentage = platformSettings?.escrowFeePercentage ?? 0.05;
  const gatewayFeePercentage = platformSettings?.paymentProcessingFeePercentage ?? 0.06;

  // El Pago Protegido solo aplica a medios digitales (MP / MODO)
  const isDigitalPayment = selectedMethod === 'MERCADO_PAGO' || selectedMethod === 'MODO';

  const protectionFee = isDigitalPayment
    ? (platformSettings?.useFixedPagoProtegidoFee
      ? (platformSettings.escrowFixedFee ?? 2500)
      : Math.round(productPrice * escrowFeePercentage))
    : 0;

  const gatewayFee = isDigitalPayment
    ? Math.round(productPrice * gatewayFeePercentage)
    : 0;

  const total = productPrice + protectionFee + gatewayFee;

  const handlePayment = async () => {
    if (!user) {
      notify({ type: 'error', title: 'Sesión Requerida', message: 'Por favor inicia sesión para finalizar tu compra.', icon: 'lock' });
      navigate('/login');
      return;
    }

    setLoading(true);

    let transactionId = currentTransactionId;

    if (!transactionId) {
      const result = await createTransaction({
        buyerId: user.uid,
        sellerId: sellerId,
        itemId: productId,
        itemTitle: productTitle,
        amountProduct: productPrice,
        amount: productPrice,
        paymentMethod: selectedMethod,
        deliveryMethod: deliveryMethod,
        itemImage: resumedTxData?.itemImage || state.productImage || (isCartMode ? cart[0]?.image : null),
        platformFee: protectionFee,
        gatewayFee: gatewayFee,
        notes: notes,
        featuredFeeApplied: (state.isFeatured && state.featuredUntil && (state.featuredUntil.toDate ? state.featuredUntil.toDate() : new Date(state.featuredUntil)) > new Date())
          ? state.featuredFeeApplied
          : null
      });

      if (!result.success || !result.id) {
        notify({ type: 'error', title: 'Error Fatal', message: 'No se pudo inicializar el libro contable seguro.', icon: 'error' });
        setLoading(false);
        return;
      }
      transactionId = result.id;
      if (isCartMode) clearCart(); // Clean cart after success
    }

    if (selectedMethod === 'MERCADO_PAGO') {
      try {
        const createPaymentFunc = httpsCallable(functions, 'createPayment');
        const response = await createPaymentFunc({
          price: total,
          title: productTitle,
          transactionId: transactionId
        }) as { data: { url: string } };

        if (response.data && response.data.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error("No URL returned from backend");
        }

      } catch (error: any) {
        if (window.location.hostname === "localhost") {
          notify({ type: 'warning', title: 'Modo de Depuración', message: 'Bypass del emulador: Simulando pago exitoso.', icon: 'developer_mode' });
          setTimeout(() => {
            navigate(`/success?collection_status=approved&external_reference=${transactionId}&payment_type=credit_card`);
          }, 1500);
          return;
        }

        const backendMessage = error.details?.message || error.message || 'Error de protocolo desconocido';
        notify({ type: 'error', title: 'Excepción de Pago', message: backendMessage, icon: 'cloud_off' });
        setLoading(false);
        return;
      }

    } else if (selectedMethod === 'MODO') {
      setCurrentTransactionId(transactionId);
      setShowModoModal(true);
      setLoading(false);
      return;
    } else {
      navigate(`/success?collection_status=pending&external_reference=${transactionId}&payment_method=${selectedMethod}`);
    }
  };

  const confirmModoPayment = () => {
    if (currentTransactionId) {
      navigate(`/success?collection_status=approved&external_reference=${currentTransactionId}&payment_type=modo`);
    }
  };

  return (
    <div className="min-h-screen bg-light-50 py-12 px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header Compacto */}
        <div className="flex items-center gap-4 mb-10">
          <div className="size-12 bg-primary-vibrant rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="material-symbols-outlined text-white font-black">lock</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-dark-800 uppercase tracking-tight">Registro de Adquisición</h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Protocolo de custodia segura activado</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Columna Izquierda: Producto y Costos */}
          <div className="w-full lg:w-[45%] space-y-6">
            <div className="bg-white rounded-[32px] shadow-premium border border-light-200 overflow-hidden animate-in fade-in slide-in-from-left-5 duration-700">
              {/* Product Header */}
              <div className="bg-dark-800 px-8 py-10 text-white relative overflow-hidden flex items-center gap-6">
                <div className="absolute top-0 right-0 size-64 bg-primary-vibrant/20 blur-[120px] -mr-16 -mt-16"></div>

                {/* Product Image Preview */}
                <div className="relative z-10 size-32 rounded-2xl overflow-hidden border-2 border-white/10 shadow-xl shrink-0">
                  <img
                    src={resumedTxData?.itemImage || state.productImage || (isCartMode ? cart[0]?.image : null) || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={productTitle}
                    className="size-full object-cover"
                  />
                </div>

                <div className="relative z-10">
                  <p className="text-primary-vibrant text-[9px] uppercase font-black tracking-[0.4em] mb-2">Protocolo de Adquisición</p>
                  <h2 className="text-2xl font-black tracking-tight capitalize line-clamp-2 leading-tight">{productTitle}</h2>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Cost Breakdown */}
                <div className="space-y-4">
                  {!isCartMode && (
                    <div className="flex items-center gap-4 py-4 border-b border-light-100/50">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-dark-800 uppercase tracking-tight">Estado del Activo</span>
                          <span className="size-1 bg-gray-300 rounded-full"></span>
                          <span className="text-[10px] font-bold text-gray-400 capitalize">{state.condition === 'new' ? 'Nuevo' : state.condition === 'like_new' ? 'Excelente' : 'Usado'}</span>
                        </div>
                        <p className="text-[11px] font-bold text-gray-500 leading-tight">Verificado bajo protocolo de inspección estándar.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center px-2 py-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      Valor del Producto
                    </span>
                    <span className="text-xs font-black text-dark-800">$ {productPrice.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center px-2 py-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                      Gastos de Pasarela
                      <span className="relative group/tip cursor-help">
                        <span className="material-symbols-outlined text-[14px] text-gray-300 hover:text-gray-500 transition-colors">help</span>
                        <span className="invisible group-hover/tip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-dark-800 text-white text-[9px] font-bold normal-case tracking-normal leading-relaxed p-3 rounded-xl shadow-xl z-50 pointer-events-none">
                          Comisión del procesador de pagos (Mercado Pago / MODO) por procesar tu transacción de forma segura.
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-800"></span>
                        </span>
                      </span>
                    </span>
                    <span className="text-xs font-black text-dark-800">$ {gatewayFee.toLocaleString()}</span>
                  </div>

                  <div className={`flex justify-between items-center p-5 rounded-[20px] border transition-all relative group overflow-hidden ${isDigitalPayment ? 'bg-primary-50 border-primary-100 text-primary-vibrant' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}>
                    {isDigitalPayment && <div className="absolute top-0 right-0 w-20 h-20 bg-primary-200/20 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`size-10 rounded-lg flex items-center justify-center shadow-sm border ${isDigitalPayment ? 'bg-white border-primary-100' : 'bg-slate-100 border-slate-200'}`}>
                        <span className={`material-symbols-outlined text-xl font-black ${isDigitalPayment ? 'text-primary-vibrant' : 'text-slate-300'}`}>
                          {isDigitalPayment ? 'gpp_good' : 'lock_open'}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[9px] font-black uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5 ${isDigitalPayment ? 'text-primary-700' : 'text-slate-500'}`}>
                          Protección Pago Protegido
                          {isDigitalPayment && (
                            <span className="relative group/tip2 cursor-help">
                              <span className="material-symbols-outlined text-[14px] text-primary-400 hover:text-primary-700 transition-colors">help</span>
                              <span className="invisible group-hover/tip2:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-dark-800 text-white text-[9px] font-bold normal-case tracking-normal leading-relaxed p-3 rounded-xl shadow-xl z-50 pointer-events-none">
                                Tarifa de custodia que garantiza que tu dinero está protegido hasta que recibas el producto conforme. Si hay un problema, te devolvemos el dinero.
                                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-dark-800"></span>
                              </span>
                            </span>
                          )}
                        </span>
                        <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest leading-none">
                          {isDigitalPayment ? 'Safe Deal Fee' : 'No aplica en trato directo'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <span className={`font-black text-base block ${isDigitalPayment ? 'text-dark-800' : 'text-slate-400'}`}>$ {protectionFee.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-light-100 pt-6">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.3em] block mb-1">Total a Transferir</span>
                      <span className="text-4xl font-black text-dark-800 tracking-tighter">$ {total.toLocaleString()}</span>
                    </div>
                    <div className="pb-1 opacity-50">
                      <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="size-1 bg-emerald-500 rounded-full animate-pulse"></span>
                        Cifrado de Punto a Punto
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 opacity-20 grayscale px-10">
              <span className="material-symbols-outlined text-xs">enhanced_encryption</span>
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Hardware Encrypted Transaction Layer</p>
            </div>
          </div>

          {/* Columna Derecha: Logística y Pago */}
          <div className="w-full lg:w-[55%] space-y-6">
            {/* Delivery Method Selector */}
            <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-sm animate-in fade-in slide-in-from-right-5 duration-700">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">local_shipping</span>
                Protocolo de Logística
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'correo_argentino', label: 'Correo Argentino', icon: 'local_shipping', sub: 'Servicio postal' },
                  { id: 'en_mano', label: 'En mano', icon: 'handshake', sub: 'En persona' },
                  { id: 'acordar', label: 'Acordar', icon: 'chat', sub: 'Con vendedor' },
                  { id: 'domicilio', label: 'Domicilio', icon: 'home', sub: 'Puerta a puerta' }
                ].filter(m => (resumedTxData?.deliveryMethods || state.deliveryMethods || ['en_mano']).includes(m.id))
                  .map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setDeliveryMethod(method.id as any)}
                      className={`flex items-center gap-3 p-4 border rounded-xl shadow-sm cursor-pointer transition-all ${deliveryMethod === method.id ? 'bg-primary-50/30 border-primary-vibrant ring-1 ring-primary-100' : 'bg-white border-light-200 hover:bg-light-100'}`}
                    >
                      <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${deliveryMethod === method.id ? 'bg-white text-primary-vibrant shadow-sm' : 'bg-light-100 text-gray-400'}`}>
                        <span className="material-symbols-outlined text-lg font-black">{method.icon}</span>
                      </div>
                      <div className="flex-grow">
                        <span className={`text-[10px] font-black uppercase tracking-widest block ${deliveryMethod === method.id ? 'text-dark-800' : 'text-gray-500'}`}>{method.label}</span>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{method.sub}</p>
                      </div>
                      {deliveryMethod === method.id && <span className="material-symbols-outlined text-sm text-primary-vibrant">check_circle</span>}
                    </div>
                  ))}
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Notas del trato (Opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre el punto de encuentro o envío..."
                  className="w-full bg-light-50 border border-light-200 rounded-xl py-3 px-4 text-xs font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-300 resize-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-1000">
              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onSelect={setSelectedMethod}
              />

              {/* Action Button */}
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-primary-vibrant text-white text-xs font-black py-5 rounded-2xl hover:opacity-95 transition-all shadow-xl shadow-primary-500/10 disabled:opacity-50 flex justify-center items-center gap-3 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                    <span className="uppercase tracking-[0.2em]">Enlazando...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined font-black text-base">verified_user</span>
                    <span className="uppercase tracking-[0.2em]">
                      {selectedMethod === 'MERCADO_PAGO' ? 'Autorizar Pago MP' :
                        selectedMethod === 'TRANSFER' ? 'Confirmar Transferencia' :
                          selectedMethod === 'MODO' ? 'Pagar con MODO' : 'Finalizar Adquisición'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODO QR MODAL */}
      {showModoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm" onClick={() => setShowModoModal(false)}></div>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowModoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-dark-800 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center mb-8">
              <img
                src="https://www.modo.com.ar/brand/MODO_Brand_Assets-Isologo_Vert-Green.png"
                alt="MODO"
                className="h-12 mx-auto mb-4 object-contain"
              />
              <h3 className="text-xl font-black text-dark-800">Escanea para Pagar</h3>
              <p className="text-xs text-gray-500 font-bold mt-2">Usa tu App Bancaria o MODO</p>
            </div>

            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-emerald-500/30 mb-8 flex justify-center relative group">
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse rounded-xl pointer-events-none"></div>
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://modo.com.ar"
                alt="QR MODO"
                className="size-48 mix-blend-multiply"
              />
              <div className="absolute bottom-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-100 shadow-sm">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                  <span className="size-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  Esperando pago...
                </span>
              </div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-2xl font-black text-dark-800">$ {total.toLocaleString()}</p>

              <button
                onClick={confirmModoPayment}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
              >
                Simular Pago Aprobado
              </button>

              <p className="text-[9px] text-gray-400 font-bold max-w-[200px] mx-auto pt-2">
                Al escanear aceptas los términos y condiciones de MODO.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
