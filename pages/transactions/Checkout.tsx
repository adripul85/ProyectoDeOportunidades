import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../App';
import { useAuth } from '../../lib/auth';
import { createTransaction, PaymentMethod } from '../../lib/transactions';
import { getProduct } from '../../lib/items';
import { httpsCallable } from 'firebase/functions'; // Use Firebase Cloud Functions
import { functions } from '../../lib/firebase';
import PaymentMethodSelector from '../../components/checkout/PaymentMethodSelector';

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('MERCADO_PAGO');
  const [deliveryMethod, setDeliveryMethod] = useState<'SHIPPING' | 'MEETING'>('MEETING');
  const [shippingAvailable, setShippingAvailable] = useState<boolean>(true); // Default true until fetched

  const { productId, productTitle, productPrice, sellerId } = location.state || {};

  React.useEffect(() => {
    if (productId) {
      getProduct(productId).then(item => {
        if (item && item.shippingAvailable !== undefined) {
          setShippingAvailable(item.shippingAvailable);
          // If shipping not available, enforce MEETING
          if (!item.shippingAvailable) setDeliveryMethod('MEETING');
        }
      });
    }
  }, [productId]);

  if (!productId) {
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

  const SERVICE_FEE_PERCENTAGE = 0.05;
  const serviceFee = productPrice * SERVICE_FEE_PERCENTAGE;
  const total = productPrice + serviceFee;

  const handlePayment = async () => {
    if (!user) {
      notify({ type: 'error', title: 'Sesión Requerida', message: 'Por favor inicia sesión para finalizar tu compra.', icon: 'lock' });
      navigate('/login');
      return;
    }

    setLoading(true);

    const result = await createTransaction({
      buyerId: user.uid,
      sellerId: sellerId,
      itemId: productId,
      itemTitle: productTitle,
      amount: productPrice,
      platformFee: serviceFee,
      total: total,
      paymentMethod: selectedMethod,
      deliveryMethod: deliveryMethod
    });

    if (!result.success || !result.id) {
      notify({ type: 'error', title: 'Error Fatal', message: 'No se pudo inicializar el libro contable seguro.', icon: 'error' });
      setLoading(false);
      return;
    }

    if (selectedMethod === 'MERCADO_PAGO') {
      try {
        const createPaymentFunc = httpsCallable(functions, 'createPayment');
        const response = await createPaymentFunc({
          price: total,
          title: productTitle,
          transactionId: result.id
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
            const mockSuccessUrl = `http://localhost:5173/#/success?collection_status=approved&external_reference=${result.id}&payment_type=credit_card`;
            window.location.href = mockSuccessUrl;
          }, 1500);
          return;
        }

        const backendMessage = error.details?.message || error.message || 'Error de protocolo desconocido';
        notify({ type: 'error', title: 'Excepción de Pago', message: backendMessage, icon: 'cloud_off' });
        setLoading(false);
        return;
      }

    } else {
      navigate(`/success?collection_status=pending&external_reference=${result.id}&payment_method=${selectedMethod}`);
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
            <h2 className="text-3xl font-black relative z-10 tracking-tight">{productTitle}</h2>
          </div>

          <div className="p-10 md:p-14 space-y-12">

            {/* Cost Breakdown */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Precio de Activo Unitario</span>
                <span className="text-xl font-black text-dark-800">$ {productPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-primary-vibrant bg-primary-50 p-8 rounded-[32px] border border-primary-100/50 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-2xl font-black">verified_user</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block mb-0.5">Seguro y Garantía</span>
                    <span className="text-[9px] font-bold text-primary-600/60 uppercase tracking-widest">Tarifa de Protección de Protocolo</span>
                  </div>
                </div>
                <span className="font-black text-lg">$ {serviceFee.toLocaleString()}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      selectedMethod === 'TRANSFER' ? 'Confirmar Transferencia Bancaria' : 'Finalizar Adquisición'}
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
    </div>
  );
}
