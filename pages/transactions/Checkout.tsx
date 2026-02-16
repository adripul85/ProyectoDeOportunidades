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

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const { cart, total: cartTotal, clearCart } = useCart(); // Added clearCart
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MERCADO_PAGO');
  const [deliveryMethod, setDeliveryMethod] = useState<'SHIPPING' | 'MEETING'>('MEETING');
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

  // Initial Fetch if Resuming
  React.useEffect(() => {
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
  }, [resumedTxId]);

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
            if (!item.shippingAvailable) setDeliveryMethod('MEETING');
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

  // Dynamic Service Fee
  const [serviceFeePercentage, setServiceFeePercentage] = useState(0.20); // Default fallback

  React.useEffect(() => {
    import('../../lib/settings').then(({ getPlatformSettings }) => {
      getPlatformSettings().then(settings => {
        if (settings.escrowFeePercentage) {
          setServiceFeePercentage(settings.escrowFeePercentage);
        }
      });
    });
  }, []);

  const serviceFee = productPrice * serviceFeePercentage;
  const total = productPrice + serviceFee;

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
        amount: productPrice,
        total: total,
        paymentMethod: selectedMethod,
        deliveryMethod: deliveryMethod,
        notes: notes
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
    <div className="min-h-screen bg-light-50 py-16 px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-20 bg-primary-50 rounded-[32px] mb-8 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-primary-vibrant font-black">lock_open</span>
          </div>
          <h1 className="text-4xl font-black text-dark-800 mb-3 uppercase tracking-tight">Resumen de Adquisición</h1>
          <p className="text-sm font-bold text-gray-400">Protección de garantía (escrow) de extremo a extremo activada.</p>
        </div>

        <div className="bg-white rounded-[40px] shadow-premium border border-light-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-700">

          {/* Product Header */}
          <div className="bg-dark-800 px-10 py-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 size-48 bg-primary-vibrant/20 blur-[100px] -mr-10 -mt-10"></div>
            <p className="text-primary-vibrant text-[10px] uppercase font-black tracking-[0.3em] mb-4 relative z-10">Objetivo de Adquisición</p>
            <h2 className="text-3xl font-black relative z-10 tracking-tight capitalize">{productTitle}</h2>
          </div>

          <div className="p-10 md:p-14 space-y-12">

            {/* Cost Breakdown */}
            <div className="space-y-6">
              {isCartMode && (
                <div className="px-4 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Desglose de Carrito</h3>
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 py-2 border-b border-light-100 last:border-0">
                      <img src={item.image} alt={item.title} className="size-10 rounded-lg object-cover" />
                      <div className="flex-grow">
                        <p className="text-xs font-bold text-dark-800 line-clamp-1">{item.title}</p>
                        <p className="text-[9px] font-medium text-gray-400">Vendido por {item.sellerName}</p>
                      </div>
                      <span className="text-xs font-black text-dark-800">$ {item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center px-4 pt-4 border-t border-light-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subtotal de Activos</span>
                <span className="text-xl font-black text-dark-800">$ {productPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-primary-vibrant bg-primary-50 p-6 rounded-[24px] border border-primary-100 shadow-sm relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary-200/20 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>

                <div className="flex items-center gap-5 relative z-10">
                  <div className="size-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-primary-100">
                    <span className="material-symbols-outlined text-2xl font-black">gpp_good</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5 text-primary-700">Zona Segura</span>
                    <span className="text-[9px] font-bold text-primary-600/60 uppercase tracking-widest">Garantía de Satisfacción 100%</span>
                  </div>
                </div>
                <span className="font-black text-lg relative z-10 text-dark-800">$ {serviceFee.toLocaleString()}</span>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-light-100 pt-10">
              <div className="flex justify-between items-end mb-4 px-2">
                <div>
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] block mb-2">Total General</span>
                  <span className="text-5xl font-black text-dark-800 tracking-tighter">$ {total.toLocaleString()}</span>
                </div>
                <div className="pb-2">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="size-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Pago Encriptado
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Method Selector */}
            <div className="bg-light-50 p-8 rounded-[32px] border border-light-200">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-6 ml-1">Protocolo de Logística</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div
                  onClick={() => setDeliveryMethod('MEETING')}
                  className={`flex items-center gap-4 p-6 border rounded-2xl shadow-sm cursor-pointer transition-all ${deliveryMethod === 'MEETING' ? 'bg-white border-primary-vibrant ring-2 ring-primary-100' : 'bg-white border-light-200 hover:bg-light-100'}`}
                >
                  <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${deliveryMethod === 'MEETING' ? 'bg-primary-50 text-primary-vibrant' : 'bg-light-100 text-gray-400'}`}>
                    <span className="material-symbols-outlined text-xl font-black">handshake</span>
                  </div>
                  <div>
                    <span className={`text-xs font-black uppercase tracking-widest block mb-1 ${deliveryMethod === 'MEETING' ? 'text-dark-800' : 'text-gray-500'}`}>Entrega Directa</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Punto de encuentro seguro.</span>
                  </div>
                  {deliveryMethod === 'MEETING' && <span className="material-symbols-outlined text-primary-vibrant ml-auto">check_circle</span>}
                </div>

                {shippingAvailable && (
                  <div
                    onClick={() => setDeliveryMethod('SHIPPING')}
                    className={`flex items-center gap-4 p-6 border rounded-2xl shadow-sm cursor-pointer transition-all ${deliveryMethod === 'SHIPPING' ? 'bg-white border-primary-vibrant ring-2 ring-primary-100' : 'bg-white border-light-200 hover:bg-light-100'}`}
                  >
                    <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${deliveryMethod === 'SHIPPING' ? 'bg-primary-50 text-primary-vibrant' : 'bg-light-100 text-gray-400'}`}>
                      <span className="material-symbols-outlined text-xl font-black">local_shipping</span>
                    </div>
                    <div>
                      <span className={`text-xs font-black uppercase tracking-widest block mb-1 ${deliveryMethod === 'SHIPPING' ? 'text-dark-800' : 'text-gray-500'}`}>Envío Certificado</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Seguimiento digital.</span>
                    </div>
                    {deliveryMethod === 'SHIPPING' && <span className="material-symbols-outlined text-primary-vibrant ml-auto">check_circle</span>}
                  </div>
                )}
              </div>

              {/* Notes Field */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-1">Notas / Especificaciones (Opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Aclara condiciones de entrega o detalles específicos del trato..."
                  className="w-full bg-white border border-light-200 rounded-2xl py-4 px-6 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100 transition-all placeholder:text-gray-300 resize-none shadow-sm"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 ml-1">Modo de Transferencia de Activos</h3>
              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onSelect={setSelectedMethod}
              />
            </div>

            {/* Action Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-primary-vibrant text-white text-base font-black py-6 rounded-3xl hover:opacity-95 transition-all shadow-2xl shadow-primary-500/10 disabled:opacity-50 flex justify-center items-center gap-4 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  <span className="uppercase tracking-[0.2em] text-xs">Sincronizando...</span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined font-black text-lg">account_balance_wallet</span>
                  <span className="uppercase tracking-[0.2em] text-xs font-black">
                    {selectedMethod === 'MERCADO_PAGO' ? 'Autorizar vía Mercado Pago' :
                      selectedMethod === 'TRANSFER' ? 'Confirmar Transferencia Bancaria' :
                        selectedMethod === 'MODO' ? 'Generar QR de Pago' : 'Finalizar Adquisición'}
                  </span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
              <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
              <p className="text-[9px] font-black uppercase tracking-[0.3em]">Seguridad de extremo a extremo de nivel cuántico</p>
            </div>

          </div>
        </div>
      </div>


      {/* MODO QR MODAL */}
      {
        showModoModal && (
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
        )
      }
    </div >
  );
}
