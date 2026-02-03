
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';



const Success = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [queryParams] = React.useState(new URLSearchParams(location.search));

  const status = queryParams.get('collection_status') || 'approved';
  const paymentMethod = queryParams.get('payment_method') || 'MERCADO_PAGO';
  const transactionId = queryParams.get('external_reference') || 'N/A';

  const { title, total } = location.state || {
    title: 'Objetivo de Adquisición',
    total: 0
  };

  const isTransfer = paymentMethod === 'TRANSFER';
  const isCash = paymentMethod === 'CASH';
  const isPending = status === 'pending' || status === 'in_process';

  return (
    <main className="flex-grow flex flex-col items-center py-20 px-6 bg-light-50 min-h-screen">
      <div className="max-w-3xl w-full flex flex-col items-center">

        {/* Dynamic Header */}
        <div className="text-center mb-16">
          {isPending && isTransfer ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="size-24 bg-dark-800 text-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-premium">
                <span className="material-symbols-outlined text-5xl font-black">account_balance</span>
              </div>
              <h1 className="text-4xl font-black text-dark-800 mb-4 uppercase tracking-tight">Solicitud de Transferencia</h1>
              <p className="text-sm font-bold text-gray-400">Reserva bloqueada. Completa la transferencia para notificar al vendedor.</p>
            </div>
          ) : isPending && isCash ? (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="size-24 bg-emerald-50 text-emerald-500 border border-emerald-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <span className="material-symbols-outlined text-5xl font-black">handshake</span>
              </div>
              <h1 className="text-4xl font-black text-dark-800 mb-4 uppercase tracking-tight">Trato Inicializado</h1>
              <p className="text-sm font-bold text-gray-400">Coordenadas de entrega requeridas. La liquidación será física.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="size-24 bg-primary-50 text-primary-vibrant border border-primary-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                <span className="material-symbols-outlined text-5xl font-black">verified</span>
              </div>
              <h1 className="text-4xl font-black text-dark-800 mb-4 uppercase tracking-tight">Pago Asegurado</h1>
              <p className="text-sm font-bold text-gray-400">Transacción verificada. Los activos están ahora en garantía (escrow) segura.</p>
            </div>
          )}
        </div>

        {/* Transaction Ticket */}
        <div className="w-full bg-white rounded-[40px] border border-light-200 shadow-premium overflow-hidden mb-16 animate-in slide-in-from-bottom-8 duration-1000">

          {/* Transfer Instructions */}
          {isTransfer && (
            <div className="p-10 bg-light-50/50 border-b border-light-100">
              <h3 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.3em]">Datos de Liquidación del Protocolo</h3>
              <div className="bg-white p-8 rounded-[32px] border border-light-200 space-y-6 shadow-sm">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Banco Destino</span>
                  <span className="text-sm font-black text-dark-800">Galicia Internacional</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">CBU / CVU</span>
                  <span className="text-sm font-black text-dark-800 font-mono tracking-tighter">0070000000000000000000</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Alias de Seguridad</span>
                  <span className="text-sm font-black text-primary-vibrant font-mono tracking-tighter">OPORTUNIDADES.CUSTODIA</span>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Nombre de la Entidad</span>
                  <span className="text-sm font-black text-dark-800">MarketTrust S.A.</span>
                </div>
              </div>
              <div className="mt-8 p-6 bg-primary-50 rounded-2xl flex gap-4 text-primary-950 text-[10px] font-bold border border-primary-100/50 uppercase tracking-widest">
                <span className="material-symbols-outlined text-lg">info</span>
                <p>Envía el comprobante a <strong className="text-primary-vibrant">pagos@markettrust.com</strong> con tu ID de Transacción.</p>
              </div>
            </div>
          )}

          {/* Ticket Header */}
          <div className="p-10 border-b border-light-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-2">Referencia del Protocolo</p>
              <h3 className="text-2xl font-black text-dark-800 font-mono tracking-tighter">{transactionId}</h3>
            </div>
            {total > 0 && (
              <div className="md:text-right">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 mb-2">Valoración del Activo</p>
                <h3 className="text-4xl font-black text-dark-800 tracking-tighter">$ {total.toLocaleString()}</h3>
              </div>
            )}
          </div>

          <div className="p-10 md:p-14">
            <h4 className="text-xl font-black text-dark-800 tracking-tight mb-10">{title}</h4>

            <div className={`p-8 rounded-[32px] border flex flex-col md:flex-row items-center gap-6 text-center md:text-left ${isTransfer ? 'bg-amber-50 border-amber-100' : 'bg-primary-50 border-primary-100'}`}>
              <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 ${isTransfer ? 'bg-white text-amber-500' : 'bg-white text-primary-vibrant'} shadow-sm`}>
                <span className="material-symbols-outlined text-3xl font-black">{isTransfer ? 'history' : 'verified_user'}</span>
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${isTransfer ? 'text-amber-700' : 'text-primary-700'}`}>
                  {isTransfer ? 'Esperando Verificación' : 'Protocolo Activo'}
                </p>
                {isTransfer ? (
                  <p className="text-xs text-amber-900 leading-relaxed font-bold uppercase tracking-tight">Tras la validación, se autorizará el despacho logístico.</p>
                ) : (
                  <p className="text-xs text-primary-900 leading-relaxed font-bold uppercase tracking-tight">
                    {isCash ? 'Intercambio físico monitoreado. Se aplican las reglas de protección de garantía (escrow).' : 'Capital asegurado. Los fondos se retienen hasta la verificación de la entrega del activo.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center px-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-12 py-6 bg-dark-800 text-white font-black rounded-3xl hover:opacity-90 transition-all shadow-2xl shadow-dark-800/20 flex items-center justify-center gap-4 active:scale-95 group"
          >
            <span className="material-symbols-outlined group-hover:rotate-[360deg] transition-transform duration-700">dashboard_customize</span>
            <span className="uppercase tracking-[0.2em] text-[10px]">Gestionar Adquisición</span>
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex-1 px-12 py-6 bg-white border-2 border-light-200 text-dark-800 font-black rounded-3xl hover:bg-light-50 transition-all flex items-center justify-center gap-4 active:scale-95"
          >
            <span className="material-symbols-outlined">hub</span>
            <span className="uppercase tracking-[0.2em] text-[10px]">Mercado Secundario</span>
          </button>
        </div>

        <div className="mt-20 flex flex-col items-center gap-4 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
          <div className="size-1 bg-gray-300 rounded-full w-24 mb-4"></div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em] flex items-center gap-3">
            <span className="material-symbols-outlined text-sm">support_agent</span>
            ¿Requieres asistencia? Protocolo #TRX-SUPPORT
          </p>
          <Link to="/help" className="text-[10px] font-black text-dark-800 uppercase tracking-widest hover:text-primary-vibrant underline underline-offset-4">Conectar con Operador Humano</Link>
        </div>
      </div>
    </main>
  );
};

export default Success;
