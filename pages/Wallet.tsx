import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { getUserTransactions, TransactionData } from '../lib/transactions';

const Wallet = () => {
  const { userProfile, user } = useAuth();
  const wallet = userProfile?.wallet || { available: 0, inEscrow: 0, pending: 0, currency: 'ARS' };
  const [transactions, setTransactions] = useState<(TransactionData & { id: string, role: 'buyer' | 'seller' })[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getUserTransactions(user.uid).then(({ compras, ventas, retiros }) => {
        const allTxs = [
          ...compras.map(t => ({ ...t, role: 'buyer' as const })),
          ...ventas.map(t => ({ ...t, role: 'seller' as const })),
          ...(retiros || []).map(t => ({ ...t, role: 'withdrawal' as const, amount: t.amount, itemTitle: 'Retiro Bancario', status: t.status === 'completed' ? 'COMPLETED' : 'PENDING_PAYMENT' }))
        ].sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });
        setTransactions(allTxs);
        setLoadingTransactions(false);
      });
    }
  }, [user]);

  // Chart Data Calculation
  const chartData = React.useMemo(() => {
    const days = 12;
    const data = new Array(days).fill(0);
    const today = new Date();

    transactions.forEach(tx => {
      if (!tx.createdAt?.seconds) return;
      if (tx.role === 'withdrawal') return; // Don't show withdrawals in activity volume for now
      const txDate = new Date(tx.createdAt.seconds * 1000);
      const diffTime = Math.abs(today.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= days) {
        data[days - diffDays] += tx.amount;
      }
    });

    // Normalize to percentage for height (max 100%)
    const maxVal = Math.max(...data, 1);
    return data.map(val => ({ value: val, height: Math.max((val / maxVal) * 100, 10) })); // Min height 10%
  }, [transactions]);

  // Bank & Withdrawal Logic
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    cbu: userProfile?.bankDetails?.cbu || '',
    alias: userProfile?.bankDetails?.alias || '',
    bankName: userProfile?.bankDetails?.bankName || '',
    holderName: userProfile?.bankDetails?.holderName || '',
    accountType: userProfile?.bankDetails?.accountType || 'CA'
  });

  const handleLinkBank = async () => {
    if (!user?.uid) return;
    const { updateUserProfile } = await import('../lib/users');
    const result = await updateUserProfile(user.uid, { bankDetails: bankForm });
    if (result.success) {
      alert('Datos bancarios vinculados correctamente.');
      setShowBankModal(false);
      window.location.reload(); // Simple reload to refresh profile context
    } else {
      alert('Error al guardar datos bancarios.');
    }
  };

  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < 1000) {
      alert('El retiro mínimo es de $1,000.');
      return;
    }
    if (amount > wallet.available) {
      alert('Fondos insuficientes.');
      return;
    }
    if (!userProfile?.bankDetails?.cbu) {
      alert('Debes vincular una cuenta bancaria primero.');
      setShowBankModal(true);
      return;
    }

    if (confirm(`¿Confirmar retiro de $${amount.toLocaleString()} a ${userProfile.bankDetails.bankName}?`)) {
      setProcessingWithdrawal(true);
      const { withdrawFunds } = await import('../lib/users');
      const result = await withdrawFunds(user!.uid, amount, userProfile.bankDetails);

      if (result.success) {
        alert('Solicitud de retiro enviada. Los fondos estarán acreditados en 24hs hábiles.');
        setWithdrawalAmount('');
        // Refresh local state to avoid full reload
        window.location.reload();
      } else {
        alert('Error al procesar el retiro: ' + result.error);
      }
      setProcessingWithdrawal(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 pb-24 bg-light-50 min-h-screen">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-dark-800 mb-2">Mi Billetera Digital</h1>
        <p className="text-sm font-bold text-gray-400">Administra tus ganancias, fondos en garantía y retiros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-12 xl:col-span-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-dark-800 p-8 text-white rounded-[40px] shadow-2xl flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 size-32 bg-primary-vibrant/20 blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <p className="text-[10px] font-black opacity-50 mb-6 uppercase tracking-[0.2em] relative z-10">Total Disponible</p>
              <p className="text-4xl font-black mb-10 relative z-10">${wallet.available.toLocaleString()}</p>
              <div className="bg-primary-vibrant text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 w-fit relative z-10">
                Activo Verificado
              </div>
            </div>

            <div className="bg-white p-8 text-dark-800 rounded-[40px] shadow-premium border border-light-200 flex flex-col">
              <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">En Garantía</p>
              <p className="text-3xl font-black mb-10">${wallet.inEscrow.toLocaleString()}</p>
              <div className="bg-primary-50 text-primary-vibrant px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-primary-100 w-fit">
                Fondos Protegidos
              </div>
            </div>

            <div className="bg-white p-8 text-dark-800 rounded-[40px] shadow-premium border border-light-200 flex flex-col">
              <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-[0.2em]">Liquidación Pendiente</p>
              <p className="text-3xl font-black mb-10">${wallet.pending.toLocaleString()}</p>
              <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 w-fit">
                En Proceso
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-4xl border border-light-200 shadow-premium">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h3 className="text-xl font-black text-dark-800 mb-1">Volumen de Actividad</h3>
                <p className="text-xs font-bold text-gray-400">Movimientos agregados en los últimos 12 días</p>
              </div>
              <div className="bg-light-100 px-4 py-2 rounded-xl text-dark-800 font-black text-[10px] uppercase tracking-widest">
                Sincronización en Tiempo Real
              </div>
            </div>
            <div className="h-48 w-full flex items-end justify-between gap-3 px-4">
              {chartData.map((d, i) => (
                <div
                  key={i}
                  className="w-full bg-dark-800/10 rounded-xl hover:bg-gradient-to-t hover:from-primary-600 hover:to-indigo-600 transition-all cursor-pointer group relative hover:shadow-lg hover:shadow-primary-500/30"
                  style={{ height: Math.max(d.height, 5) + '%' }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-dark-800 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    ${d.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-4xl border border-light-200 shadow-premium overflow-hidden">
            <div className="px-10 py-8 border-b border-light-100 flex items-center justify-between">
              <h3 className="text-lg font-black text-dark-800">Historial de Transacciones</h3>
              <button className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest hover:underline transition-all">Descargar CSV</button>
            </div>

            <div className="p-0">
              {loadingTransactions ? (
                <div className="p-20 text-center">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary-vibrant mb-4">progress_activity</span>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando movimientos...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="size-16 bg-light-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-gray-400">history</span>
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    No hay movimientos registrados en este período.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-light-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-6 hover:bg-light-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className={`size-12 rounded-2xl flex items-center justify-center ${tx.role === 'seller' ? 'bg-emerald-50 text-emerald-600' : tx.role === 'buyer' ? 'bg-rose-50 text-rose-600' : 'bg-gray-50 text-gray-600'}`}>
                          <span className="material-symbols-outlined">
                            {tx.role === 'seller' ? 'arrow_downward' : tx.role === 'buyer' ? 'arrow_upward' : 'account_balance_wallet'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-dark-800 mb-1">{tx.itemTitle}</p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${tx.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              tx.status === 'PAID_HELD' ? 'bg-primary-50 text-primary-vibrant border-primary-100' :
                                'bg-gray-50 text-gray-500 border-gray-100'
                              }`}>
                              {tx.status === 'COMPLETED' ? 'Completado' :
                                tx.status === 'PAID_HELD' ? 'En Custodia' :
                                  tx.status === 'PENDING_PAYMENT' ? 'Pendiente' : tx.status}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {tx.createdAt?.seconds ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${tx.role === 'seller' ? 'text-emerald-600' : 'text-dark-800'}`}>
                          {tx.role === 'seller' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {tx.role === 'withdrawal' ? 'Transferencia Bancaria' : tx.paymentMethod === 'MERCADO_PAGO' ? 'Mercado Pago' : 'Transferencia'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-4 xl:sticky xl:top-24 h-fit">
          <div className="bg-white p-10 rounded-4xl border-2 border-dark-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 size-20 bg-dark-800/5 -mr-5 -mt-5 rounded-full"></div>
            <h3 className="text-2xl font-black text-dark-800 mb-10">Retirar Fondos</h3>
            <div className="space-y-12">
              <div>
                <label className="block text-[10px] font-black text-gray-400 mb-4 uppercase tracking-widest ml-1">Monto a Transferir</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-dark-800/20 font-black text-2xl">$</span>
                  <input
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    type="number"
                    className="w-full pl-12 pr-8 py-6 bg-light-50 border-2 border-transparent focus:border-primary-100 focus:bg-white rounded-3xl text-3xl font-black text-dark-800 outline-none transition-all placeholder:text-light-200"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-between items-center mt-4 px-2">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Retiro Mín.: $1,000</p>
                  <button onClick={() => setWithdrawalAmount(wallet.available.toString())} className="text-[10px] text-primary-vibrant font-black uppercase tracking-widest hover:underline">Retirar Todo</button>
                </div>
              </div>

              <div className="pt-8 border-t border-light-100">
                <label className="block text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest ml-1">Cuenta de Destino</label>
                <button
                  onClick={() => setShowBankModal(true)}
                  className={`w-full py-5 border-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${userProfile?.bankDetails ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'border-dashed border-light-200 text-gray-400 hover:bg-light-50'}`}
                >
                  <span className="material-symbols-outlined text-sm">account_balance</span>
                  {userProfile?.bankDetails ? `Cuenta: ${userProfile.bankDetails.bankName} (...${userProfile.bankDetails.cbu.slice(-4)})` : 'Vincular Cuenta Bancaria (CBU/CVU)'}
                </button>
              </div>

              <button
                onClick={handleWithdrawal}
                className="w-full bg-dark-800 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-dark-800/10 hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <span className="material-symbols-outlined text-lg">bolt</span>
                Procesar Retiro
              </button>

              <div className="bg-primary-50/50 p-6 rounded-3xl border border-primary-100/50">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-primary-vibrant text-xl font-black">shield</span>
                  <p className="text-[10px] font-bold text-primary-800/60 leading-relaxed uppercase">
                    Los retiros se procesan al instante en días hábiles (09:00 - 18:00). Todos los fondos están protegidos por nuestro fondo de garantía de satisfacción.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-800/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-dark-800">Datos Bancarios</h3>
              <button onClick={() => setShowBankModal(false)} className="size-10 rounded-full bg-light-50 flex items-center justify-center hover:bg-light-100 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">CBU / CVU</label>
                <input className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="0000000000000000000000"
                  value={bankForm.cbu} onChange={e => setBankForm({ ...bankForm, cbu: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Alias</label>
                <input className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="nombre.apellido.mp"
                  value={bankForm.alias} onChange={e => setBankForm({ ...bankForm, alias: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Banco / Entidad</label>
                  <input className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="Mercado Pago"
                    value={bankForm.bankName} onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Tipo Cuenta</label>
                  <select className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100"
                    value={bankForm.accountType} onChange={e => setBankForm({ ...bankForm, accountType: e.target.value })}
                  >
                    <option value="CA">Caja de Ahorro</option>
                    <option value="CC">Cuenta Corriente</option>
                    <option value="VIRTUAL">Billetera Virtual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-dark-800 uppercase tracking-widest mb-2">Titular de la Cuenta</label>
                <input className="w-full bg-light-50 border border-light-200 rounded-xl px-4 py-3 font-bold text-dark-800 outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="Nombre Completo"
                  value={bankForm.holderName} onChange={e => setBankForm({ ...bankForm, holderName: e.target.value })}
                />
              </div>

              <button
                onClick={handleLinkBank}
                className="w-full bg-dark-800 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg mt-4"
              >
                Guardar Datos
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed max-w-xs mx-auto">
                Al guardar, confirmas que eres el titular de la cuenta. Los retiros a terceros serán rechazados.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
