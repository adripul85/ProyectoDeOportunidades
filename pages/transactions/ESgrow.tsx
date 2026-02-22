
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    actions,
    transaction
  } = useEscrow(id);

  const [trackingId, setTrackingId] = useState('');
  const [courier, setCourier] = useState('Correo Argentino');
  const hasEvidence = evidence && evidence.length > 0;
  const sellerInputRef = React.useRef<HTMLInputElement>(null);
  const buyerInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (e.target.files && e.target.files[0]) {
      actions.uploadEvidence(e.target.files[0], type);
    }
  };

  const triggerSuccessEffects = () => {
    // 1. Vibración Hápica
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 200]);
    }
    // 2. Confeti
    const duration = 3 * 1000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#00C853', '#1a1a1a'] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#00C853', '#1a1a1a'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const downloadTicket = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Comprobante de Transacción Segura", 14, 22);
    doc.setFontSize(10);
    doc.text(`ID de Protocolo: ${dealData.id}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 35);
    autoTable(doc, {
      startY: 45,
      head: [['Concepto', 'Detalle']],
      body: [
        ['Producto', dealData.title],
        ['Monto Liberado', `$${dealData.price}`],
        ['Vendedor ID', transaction?.sellerId || 'Verificado'],
        ['Comprador ID', transaction?.buyerId || 'Verificado'],
        ['Estado Final', 'COMPLETADO / FONDOS LIBERADOS'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [26, 26, 26] }
    });
    doc.save(`Ticket_Escrow_${dealData.id}.pdf`);
  };



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
            <h1 className="text-3xl font-black text-dark-800 tracking-tight">Trato en Curso</h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">Referencia #{dealData.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4 bg-light-50/50 px-6 py-4 rounded-3xl border border-light-100">
            <img src={dealData.seller.avatar} alt="Seller" className="size-10 rounded-2xl object-cover border-2 border-white shadow-sm" />
            <div>
              <p className="text-[11px] font-black text-dark-800 uppercase tracking-tight">{dealData.seller.name}</p>
              <p className="text-[9px] text-primary-vibrant font-black uppercase tracking-widest mt-1">Vendedor Verificado</p>
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

          {/* BUYER VIEW: Pending Payment Prompt */}
          {currentUserRole === 'COMPRADOR' && status === 'PENDING_PAYMENT' && (
            <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-200 shadow-premium mb-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2">Pago Pendiente</h3>
              <p className="text-[11px] text-amber-800/70 mb-6 font-bold">
                Para iniciar el protocolo de seguridad, debes completar el pago del activo.
              </p>
              <button
                onClick={() => navigate(`/checkout?tx=${id}`)}
                className="w-full bg-primary-vibrant text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-vibrant/20 active:scale-95"
              >
                Pagar Ahora
              </button>
            </div>
          )}

          {/* BUYER VIEW: Confirm Receipt / QR Display */}
          {currentUserRole === 'COMPRADOR' && (status === 'PAID_HELD' || status === 'SHIPPED') && (
            <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-premium mb-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-16 bg-primary-50 text-primary-vibrant rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">qr_code_2</span>
              </div>

              <h3 className="text-sm font-black text-dark-800 uppercase tracking-widest mb-2">Código de Entrega</h3>
              <p className="text-[10px] text-gray-500 mb-6 font-bold uppercase tracking-tight">Muestra este código al vendedor para confirmar la recepción.</p>

              {/* QR Display */}
              <div className="bg-white p-4 rounded-3xl border-2 border-primary-100 mb-6 inline-block shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${transaction?.qrCode || 'ERROR'}`}
                  alt="QR Code"
                  className="size-32 grayscale hover:grayscale-0 transition-all cursor-pointer"
                  onClick={() => notify({ type: 'info', title: 'Token de Seguridad', message: `Tu código es: ${transaction?.qrCode}`, icon: 'key' })}
                />
                <div className="mt-4 py-2 px-4 bg-light-50 rounded-xl border border-light-100">
                  <span className="text-lg font-black text-dark-800 tracking-[0.3em] font-mono">{transaction?.qrCode}</span>
                </div>
              </div>

              <div className="h-px bg-light-100 my-8"></div>

              <div className="flex flex-col gap-4">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">O confirma de forma remota:</p>
                <input
                  type="file"
                  accept="image/*"
                  ref={buyerInputRef}
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, 'RECEPCION')}
                />
                <button
                  onClick={() => buyerInputRef.current?.click()}
                  className="w-full btn-secondary py-4 flex items-center justify-center gap-2 border border-light-200"
                >
                  <span className="material-symbols-outlined">add_a_photo</span>
                  Subir Foto de Recepción
                </button>
                <button
                  onClick={async () => {
                    const res = await actions.updateStatus('COMPLETED', '✅ El comprador confirmó la recepción del paquete de forma remota.');
                    if (res.success) {
                      triggerSuccessEffects();
                      notify({ type: 'success', title: '¡Trato Hecho!', message: 'Fondos liberados al vendedor.', icon: 'verified' });
                    }
                  }}
                  className="w-full btn-primary bg-emerald-600 py-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <span className="material-symbols-outlined">verified</span>
                  Confirmar sin código
                </button>
              </div>
            </div>
          )}

          {/* SELLER VIEW: Tracking Input */}
          {currentUserRole === 'VENDEDOR' && status === 'PAID_HELD' && (
            <div className="bg-white p-8 rounded-[32px] border border-light-200 shadow-premium mb-6 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-sm font-black text-dark-800 uppercase tracking-widest mb-6">Registrar Envío / Entrega</h3>

              {!hasEvidence && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4 mb-6 cursor-pointer hover:bg-amber-100 transition-colors" onClick={() => sellerInputRef.current?.click()}>
                  <span className="material-symbols-outlined text-amber-600">add_a_photo</span>
                  <div>
                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight">Foto Requerida - Toca para subir</p>
                    <p className="text-[9px] text-amber-700 mt-1 leading-relaxed">
                      Sube una foto del paquete o producto antes de confirmar el envío.
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={sellerInputRef}
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'ENVIO')}
              />

              <div className="space-y-4">
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full bg-light-50 border border-light-200 rounded-2xl py-4 px-6 font-bold text-xs outline-none"
                >
                  <option>Correo Argentino</option>
                  <option>Andreani</option>
                  <option>OCASA</option>
                  <option>Personal (Entregado en mano)</option>
                </select>

                {courier === 'Personal (Entregado en mano)' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="h-px bg-light-100 my-2"></div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-primary-vibrant ml-1">Código de Seguridad del Comprador</label>
                    <input
                      type="text"
                      placeholder="Ej: A1B2C3D4"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                      className="w-full bg-primary-50 border-2 border-primary-200 rounded-2xl py-5 px-6 font-black text-xl text-center tracking-[0.2em] outline-none focus:border-primary-vibrant transition-all"
                    />
                    <p className="text-[9px] text-gray-400 font-bold uppercase text-center">Pide el código al comprador antes de entregar el activo.</p>
                  </div>
                )}

                <button
                  onClick={async () => {
                    if (courier === 'Personal (Entregado en mano)') {
                      const res = await actions.releaseEscrow(trackingId);
                      if (res.success) {
                        triggerSuccessEffects();
                      }
                    } else {
                      actions.registerTracking(trackingId || 'ENTREGA_PERSONAL', courier);
                    }
                  }}
                  disabled={!hasEvidence && courier !== 'Personal (Entregado en mano)'}
                  className="w-full btn-primary py-4 text-[10px] font-black tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary-vibrant/20"
                >
                  {courier === 'Personal (Entregado en mano)' ? 'Validar y Liberar Fondos' : 'Confirmar Envío / Entrega'}
                </button>
              </div>
            </div>
          )}

          {/* MEDIATOR VIEW: Admin Validation for Bank Transfers */}
          {currentUserRole === 'MEDIADOR' && status === 'PENDING_PAYMENT' && (
            <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-200 shadow-premium mb-6 text-center animate-in fade-in zoom-in duration-500">
              <div className="size-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">account_balance</span>
              </div>
              <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-2">Validación Administrativa</h3>
              <p className="text-[11px] text-amber-800/70 mb-6 font-bold">
                Verifica la acreditación en la cuenta bancaria de la empresa antes de confirmar.
              </p>
              <button
                onClick={() => actions.updateStatus('PAID_HELD', '🏦 Pago verificado en cuenta de empresa por el Administrador.')}
                className="w-full bg-dark-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-dark-800/10 active:scale-95"
              >
                Confirmar Transferencia Bancaria
              </button>
            </div>
          )}

          {/* COMPLETED VIEW: Download Ticket */}
          {status === 'COMPLETED' && (
            <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 text-center animate-in zoom-in shadow-premium mt-6">
              <span className="material-symbols-outlined text-emerald-600 text-5xl mb-4">task_alt</span>
              <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Transacción Exitosa</h3>
              <p className="text-xs text-emerald-700 mb-6 font-bold">El activo ha sido entregado y los fondos transferidos.</p>
              <button
                onClick={downloadTicket}
                className="btn-primary bg-dark-800 w-full py-4 flex items-center justify-center gap-2 shadow-lg shadow-dark-800/20"
              >
                <span className="material-symbols-outlined">download</span>
                Descargar Ticket Legal (PDF)
              </button>
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
            onUpload={() => sellerInputRef.current?.click()}
          />

          <EscrowActions
            status={status}
            currentUserRole={currentUserRole}
            price={dealData.price}
            onUpdateStatus={actions.updateStatus}
            onReleaseFunds={() => actions.releaseEscrow()}
            onRequestMediation={() => actions.updateStatus('DISPUTED', '⚖️ Protocolo de mediación iniciado por el usuario.')}
            onCancel={() => {
              if (window.confirm("⚠️ ¿Estás seguro de cancelar este trato?\n\nSi eres COMPRADOR: Se te devolverá el dinero MENOS una penalización del 3% ($" + (dealData.price * 0.03).toFixed(2) + ") por gastos administrativos.\n\nEsta acción es irreversible.")) {
                actions.cancelEscrow();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ESgrow;
