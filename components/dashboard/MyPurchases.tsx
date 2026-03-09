import React from 'react';
import { Link } from 'react-router-dom';
import { TransactionData } from '../../lib/transactions';

interface MyPurchasesProps {
    purchases: (TransactionData & { id: string })[];
    formatDate: (timestamp: any) => string;
    onConfirmReceipt: (txId: string) => void;
}

export default function MyPurchases({ purchases, formatDate, onConfirmReceipt }: MyPurchasesProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pl-2">
                <h2 className="text-2xl font-black text-dark-800 tracking-tighter uppercase">Compras Recientes</h2>
                <p className="text-[10px] font-black text-primary-vibrant uppercase tracking-widest">Protección de Pago Activa 🛡️</p>
            </div>

            <div className="grid gap-6">
                {purchases.map((order) => {
                    // Logic for status labels
                    const getStatusLabel = (status: string) => {
                        switch (status) {
                            case 'PAID_HELD': return 'Pago en Custodia';
                            case 'SHIPPED': return 'Producto en Camino';
                            case 'DELIVERED_PENDING_REVIEW': return 'Llegó (Confirmar)';
                            case 'COMPLETED': return 'Finalizado';
                            case 'CANCELLED': return 'Cancelado';
                            default: return 'En Proceso';
                        }
                    };

                    const statusColor = order.status === 'COMPLETED' ? 'text-emerald-500 bg-emerald-50' :
                        order.status === 'CANCELLED' ? 'text-red-500 bg-red-50' :
                            'text-primary-vibrant bg-primary-50';

                    return (
                        <div key={order.id} className="bg-white border border-light-200 rounded-[32px] overflow-hidden shadow-premium hover:shadow-premium-lg transition-all group">
                            <div className="p-8 flex flex-col md:flex-row gap-8">

                                {/* Imagen del Producto */}
                                <div className="size-28 bg-light-50 rounded-2xl overflow-hidden flex-shrink-0 border border-light-100 flex items-center justify-center">
                                    {order.itemImage ? (
                                        <img src={order.itemImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={order.itemTitle} />
                                    ) : (
                                        <span className="material-symbols-outlined text-4xl text-gray-200 font-black">image</span>
                                    )}
                                </div>

                                {/* Info Principal */}
                                <div className="flex-grow space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black text-gray-400 bg-light-50 px-3 py-1 rounded-lg uppercase tracking-widest border border-light-100">
                                            Orden #{order.id.slice(-6).toUpperCase()}
                                        </span>
                                        <p className="text-2xl font-black text-dark-800 tracking-tighter">${(order.amountTotal || order.total)?.toLocaleString('es-AR')}</p>
                                    </div>
                                    <h3 className="text-xl font-black text-dark-800 leading-tight group-hover:text-primary-vibrant transition-colors">{order.itemTitle}</h3>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Fecha: {formatDate(order.createdAt)}</span>
                                        <span className="size-1 bg-gray-200 rounded-full"></span>
                                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full border border-current shadow-sm ${statusColor}`}>
                                            <span className="material-symbols-outlined text-sm font-black">
                                                {order.status === 'COMPLETED' ? 'verified' :
                                                    order.status === 'SHIPPED' ? 'local_shipping' :
                                                        order.status === 'PAID_HELD' ? 'lock_clock' : 'schedule'}
                                            </span>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>

                                    {order.status === 'SHIPPED' && order.trackingId && (
                                        <div className="mt-4 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-center gap-3 animate-in slide-in-from-left-2">
                                            <span className="material-symbols-outlined text-primary-vibrant">local_shipping</span>
                                            <div className="text-[10px] font-black uppercase">
                                                <p className="text-primary-vibrant mb-0.5">Seguimiento: {order.courier || 'Correo Argentino'}</p>
                                                <p className="text-dark-800 tracking-widest">{order.trackingId}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Botones de Acción Crítica */}
                                <div className="flex flex-col gap-3 justify-center min-w-[220px]">
                                    {(order.status === 'SHIPPED' || order.status === 'PAID_HELD' || order.status === 'DELIVERED_PENDING_REVIEW') ? (
                                        <>
                                            <button
                                                className="w-full bg-dark-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-dark-800/20 active:scale-95 flex items-center justify-center gap-2"
                                                onClick={() => onConfirmReceipt(order.id)}
                                            >
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                                Confirmar Recepción
                                            </button>
                                            <Link
                                                to={`/resolution-center?tx=${order.id}`}
                                                className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-red-500 transition-colors text-center"
                                            >
                                                ¿Problemas con el producto?
                                            </Link>
                                        </>
                                    ) : order.status === 'COMPLETED' ? (
                                        <div className="flex flex-col items-center gap-3 py-2">
                                            <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                                <span className="material-symbols-outlined text-sm font-black">verified</span>
                                                Compra Finalizada
                                            </div>
                                            <Link to={`/product/${order.itemId}`} className="text-[10px] font-black text-primary-vibrant hover:underline uppercase tracking-widest">Dejar Opinión</Link>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 bg-light-50 rounded-2xl border border-light-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Esperando al vendedor...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Banner de Garantía */}
                            <div className="bg-light-50/50 px-8 py-4 flex items-center justify-between border-t border-light-100">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <span className="material-symbols-outlined text-base">gpp_good</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Tu pago está protegido hasta que confirmas la recepción</span>
                                </div>
                                <Link to={`/messages`} className="text-[9px] font-black text-dark-800 uppercase flex items-center gap-2 hover:text-primary-vibrant transition-colors">
                                    <span className="material-symbols-outlined text-base">chat_bubble</span>
                                    Mensaje al vendedor
                                </Link>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
