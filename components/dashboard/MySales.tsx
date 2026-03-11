import React from 'react';
import { TransactionData } from '../../lib/transactions';

interface MySalesProps {
    sales: (TransactionData & { id: string })[];
    formatDate: (timestamp: any) => string;
    onUpdateTracking: (txId: string) => void;
    shippingTx: string | null;
    setShippingTx: (id: string | null) => void;
    trackingInput: string;
    setTrackingInput: (val: string) => void;
    courierInput: string;
    setCourierInput: (val: string) => void;
    handleUpdateTracking: (txId: string) => void;
    handleManualDelivery: (txId: string, method: string) => void;
}

export default function MySales({
    sales,
    formatDate,
    onUpdateTracking,
    shippingTx,
    setShippingTx,
    trackingInput,
    setTrackingInput,
    courierInput,
    setCourierInput,
    handleUpdateTracking,
    handleManualDelivery
}: MySalesProps) {
    // Cálculos de KPIs
    const totalSales = sales.length;
    const totalRevenue = sales.filter(s => s.status === 'COMPLETED').reduce((acc, curr) => acc + (curr.amountProduct || curr.amount), 0);
    // Ganancia asumiendo fee del 7%
    const estimatedProfit = totalRevenue * 0.93; 
    const moneyInEscrow = sales.filter(s => ['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW'].includes(s.status)).reduce((acc, curr) => acc + (curr.amountProduct || curr.amount), 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pl-2">
                <h2 className="text-2xl font-black text-dark-800 tracking-tighter uppercase">Mis Ventas</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seguimiento de Cobros</p>
            </div>

            {/* ANALÍTICAS Y KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-6 rounded-3xl border border-light-200 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-primary-500 mb-2">trending_up</span>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Vendido</p>
                        <p className="text-2xl font-black text-dark-800 tracking-tighter">${totalRevenue.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-emerald-500 mb-2">savings</span>
                    <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Tu Ganancia Neta</p>
                        <p className="text-2xl font-black text-emerald-700 tracking-tighter">${estimatedProfit.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-amber-500 mb-2">lock_clock</span>
                    <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">En Custodia</p>
                        <p className="text-2xl font-black text-amber-700 tracking-tighter">${moneyInEscrow.toLocaleString('es-AR')}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-light-200 shadow-sm flex flex-col justify-between">
                    <span className="material-symbols-outlined text-gray-400 mb-2">receipt_long</span>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ventas Históricas</p>
                        <p className="text-2xl font-black text-dark-800 tracking-tighter">{totalSales}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {sales.map((order) => (
                    <div key={order.id} className="bg-white border border-light-200 rounded-[32px] overflow-hidden shadow-premium hover:shadow-premium-lg transition-all group">
                        <div className="p-8 flex flex-col md:flex-row gap-10">

                            {/* Imagen y Info Base */}
                            <div className="flex gap-6 flex-[1.5]">
                                <div className="size-24 bg-light-50 rounded-2xl overflow-hidden flex-shrink-0 border border-light-100">
                                    {order.itemImage ? (
                                        <img src={order.itemImage} className="w-full h-full object-cover" alt={order.itemTitle} />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl text-gray-200 flex items-center justify-center size-full">image</span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-widest border border-amber-100/50">
                                        ID #{order.id.slice(-6).toUpperCase()}
                                    </span>
                                    <h3 className="text-lg font-black text-dark-800 leading-tight line-clamp-2">{order.itemTitle}</h3>
                                    <p className="text-2xl font-black text-dark-800 tracking-tighter">${(order.amountProduct || order.amount)?.toLocaleString('es-AR')}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(order.createdAt)}</p>
                                </div>
                            </div>

                            {/* Money Timeline */}
                            <div className="flex-grow space-y-6 flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Progreso de Liquidación</h4>
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-md border ${order.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-50 border-emerald-100' : 'text-primary-vibrant bg-primary-50 border-primary-100'
                                        }`}>
                                        {order.status === 'COMPLETED' ? 'DINERO LIBERADO' : 'EN CUSTODIA'}
                                    </span>
                                </div>

                                <div className="relative flex justify-between px-2">
                                    {/* Step 1: Venta */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`size-8 rounded-full flex items-center justify-center shadow-lg transition-all ${['PAID_HELD', 'SHIPPED', 'DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(order.status)
                                            ? 'bg-emerald-500 text-white shadow-emerald-200 scale-110'
                                            : 'bg-white border-2 border-light-200 text-light-300'
                                            }`}>
                                            <span className="material-symbols-outlined text-xs font-black">payments</span>
                                        </div>
                                        <span className="text-[8px] mt-2 font-black text-gray-400 uppercase tracking-widest">Cobrado</span>
                                    </div>

                                    {/* Conector 1 */}
                                    <div className={`absolute top-4 left-[15%] w-[30%] h-[3px] rounded-full transition-all duration-700 ${['SHIPPED', 'DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(order.status) ? 'bg-emerald-500' : 'bg-light-100'
                                        }`}></div>

                                    {/* Step 2: Entrega */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${['SHIPPED', 'DELIVERED_PENDING_REVIEW', 'COMPLETED'].includes(order.status)
                                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110'
                                            : 'bg-white border-2 border-light-200 text-light-300'
                                            }`}>
                                            <span className="material-symbols-outlined text-xs font-black">local_shipping</span>
                                        </div>
                                        <span className="text-[8px] mt-2 font-black text-gray-400 uppercase tracking-widest">Enviado</span>
                                    </div>

                                    {/* Conector 2 */}
                                    <div className={`absolute top-4 left-[55%] w-[30%] h-[3px] rounded-full transition-all duration-700 ${order.status === 'COMPLETED' ? 'bg-primary-vibrant' : 'bg-light-100'
                                        }`}></div>

                                    {/* Step 3: Pago Final */}
                                    <div className="flex flex-col items-center z-10">
                                        <div className={`size-8 rounded-full flex items-center justify-center transition-all ${order.status === 'COMPLETED'
                                            ? 'bg-primary-vibrant text-white shadow-lg shadow-primary-200 scale-125 ring-4 ring-primary-50'
                                            : 'bg-white border-2 border-light-200 text-light-300'
                                            }`}>
                                            <span className="material-symbols-outlined text-xs font-black">account_balance</span>
                                        </div>
                                        <span className="text-[8px] mt-2 font-black text-gray-400 uppercase tracking-widest">Dinero Liberado</span>
                                    </div>
                                </div>

                                {order.status === 'COMPLETED' && (
                                    <p className="text-[10px] text-center font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                                        Liquidación exitosa a tu cuenta bancaria vinculada.
                                    </p>
                                )}
                            </div>

                            {/* Acciones */}
                            <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                                {order.status === 'PAID_HELD' && (
                                    <>
                                        {shippingTx === order.id ? (
                                            <div className="flex flex-col gap-2 p-3 bg-light-50 rounded-2xl border border-light-200 animate-in zoom-in-95 duration-200">
                                                <input
                                                    type="text"
                                                    placeholder="Seguimiento #"
                                                    value={trackingInput}
                                                    onChange={(e) => setTrackingInput(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl bg-white border border-light-200 outline-none text-[10px] font-black uppercase tracking-widest focus:border-primary-vibrant"
                                                />
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleUpdateTracking(order.id)} className="flex-1 py-3 bg-primary-vibrant text-white rounded-xl text-[10px] font-black uppercase">OK</button>
                                                    <button onClick={() => setShippingTx(null)} className="size-10 bg-white border border-light-200 text-gray-400 rounded-xl flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setShippingTx(order.id)}
                                                className="w-full bg-primary-vibrant text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-200"
                                            >
                                                <span className="material-symbols-outlined text-base">local_shipping</span>
                                                Informar envío
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleManualDelivery(order.id, order.deliveryMethod)}
                                            className="w-full bg-white border border-light-200 text-dark-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-light-50 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-base">handshake</span>
                                            Entregado en mano
                                        </button>
                                    </>
                                )}
                                {order.status === 'SHIPPED' && (
                                    <div className="bg-light-50 p-4 rounded-2xl border border-light-100 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tracking</p>
                                        <p className="text-xs font-black text-dark-800 tracking-widest">{order.trackingId}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
