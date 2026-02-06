
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../App';

// Hooks
import { useEscrow, UserRole } from '../../hooks/useEscrow';

// Components
import EscrowStatusDisplay from '../../components/esgrow/EscrowStatus';
import EscrowChat from '../../components/esgrow/EscrowChat';
import EscrowEvidence from '../../components/esgrow/EscrowEvidence';
import EscrowActions from '../../components/esgrow/EscrowActions';

const ESgrow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const {
    dealData,
    currentUserRole,
    status,
    messages,
    evidence,
    isVerifyingAI,
    isTyping,
    deadline,
    actions
  } = useEscrow(id);

  const [trackingId, setTrackingId] = useState('');
  const [courier, setCourier] = useState('Correo Argentino');

  const handleDownload = () => {
    const content = `=== REGISTRO DE TRANSACCIÓN ===\nTrato: #${dealData.id}\nEstado: ${status}\n\n` +
      messages.map(m => `[${m.time}] ${m.role.toUpperCase()}: ${m.text}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Registro_Protocolo_${dealData.id}.txt`;
    link.click();
    notify({ type: 'info', title: 'Registro Exportado', message: 'El historial de transacciones ha sido guardado.', icon: 'description' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 min-h-screen bg-light-50">
      {/* HEADER: Protocolo de Transacción */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 mb-16 bg-white p-10 rounded-[40px] border border-light-200 shadow-premium">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate(-1)} className="size-14 bg-light-50 rounded-2xl border border-light-200 hover:bg-white hover:shadow-sm transition-all flex items-center justify-center group">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-black text-dark-800 tracking-tight">Protocolo de Transacción</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">ID Operacional #{dealData.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4 bg-light-50/50 px-6 py-4 rounded-3xl border border-light-100">
            <img src={dealData.seller.avatar} alt="Seller" className="size-10 rounded-2xl object-cover border-2 border-white shadow-sm" />
            <div>
              <p className="text-[11px] font-black text-dark-800 uppercase tracking-tight">{dealData.seller.name}</p>
              <p className="text-[9px] text-primary-vibrant font-black uppercase tracking-widest mt-1">Entidad Verificada</p>
            </div>
          </div>

          <div className="h-10 w-px bg-light-200 hidden xl:block mx-2"></div>

          <div className="relative">
            <select
              value={currentUserRole}
              onChange={(e) => actions.toggleRole(e.target.value as UserRole)}
              className="appearance-none pl-6 pr-12 py-4 bg-dark-800 text-white border-none rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] focus:ring-4 focus:ring-primary-vibrant/10 outline-none cursor-pointer shadow-xl shadow-dark-800/10"
            >
              <option value="COMPRADOR">Simulación: Comprador</option>
              <option value="VENDEDOR">Simulación: Vendedor</option>
              <option value="MEDIADOR">Simulación: Mediador</option>
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-sm">unfold_more</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-10">
          <EscrowStatusDisplay
            status={status}
            deadline={deadline}
          />

          {/* New Section: Tracking Input for Seller */}
          {currentUserRole === 'VENDEDOR' && status === 'PAID_HELD' && (
            <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-premium animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-black text-dark-800 uppercase tracking-widest mb-6">Registrar Envío</h3>
              <div className="space-y-4">
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full bg-light-50 border border-light-200 rounded-2xl py-4 px-6 font-bold text-xs outline-none"
                >
                  <option>Correo Argentino</option>
                  <option>Andreani</option>
                  <option>OCASA</option>
                  <option>Personal (En mano)</option>
                </select>
                <input
                  type="text"
                  placeholder="Número de Tracking"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="w-full bg-light-50 border border-light-200 rounded-2xl py-4 px-6 font-bold text-xs outline-none"
                />
                <button
                  onClick={() => actions.registerTracking(trackingId, courier)}
                  disabled={!trackingId}
                  className="w-full btn-primary py-4 text-[10px] font-black tracking-widest uppercase disabled:opacity-50"
                >
                  Confirmar Despacho
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-8 space-y-10">
          <EscrowChat
            messages={messages}
            currentUserRole={currentUserRole}
            onSendMessage={actions.sendMessage}
            onDownload={handleDownload}
            isTyping={isTyping}
          />

          <EscrowEvidence
            evidence={evidence}
            isVerifyingAI={isVerifyingAI}
            onUpload={actions.uploadEvidence}
          />

          <EscrowActions
            status={status}
            currentUserRole={currentUserRole}
            price={dealData.price}
            onUpdateStatus={actions.updateStatus}
            onReleaseFunds={() => actions.releaseEscrow()}
            onRequestMediation={() => actions.updateStatus('DISPUTED', '⚖️ Protocolo de mediación iniciado por el usuario.')}
          />
        </div>
      </div>
    </div>
  );
};

export default ESgrow;
