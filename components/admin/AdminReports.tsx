import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { json2csv } from 'json-2-csv';
import { fetchMonthlySales } from '../../lib/admin';
import { useNotification } from '../../context/NotificationContext';

export default function AdminReports() {
    const [isGenerating, setIsGenerating] = useState(false);
    const { notify } = useNotification();

    const exportMonthlyReport = async (month: string) => {
        setIsGenerating(true);
        try {
            // 1. Consultamos las ventas finalizadas del mes
            const sales = await fetchMonthlySales(month);

            if (sales.length === 0) {
                notify({ type: 'warning', title: 'Sin Datos', message: 'No hay ventas completadas en este periodo.', icon: 'warning' });
                setIsGenerating(false);
                return;
            }

            // 2. Mapeamos los datos para que sean legibles para el contador
            const reportData = sales.map((sale: any) => ({
                Fecha: sale.createdAt?.toDate ? sale.createdAt.toDate().toLocaleDateString() : 'N/A',
                ID_Operacion: sale.id,
                Vendedor_ID: sale.sellerId,
                Comprador_ID: sale.buyerId,
                Monto_Total: sale.amountTotal || sale.total || sale.amount,
                Comision_VendeloYa: sale.amountPlatformFee || sale.platformFee || 0, // Tu ganancia
                Monto_a_Liquidar: sale.amountProduct || sale.amount, // Lo que va al vendedor
                Estado: sale.status
            }));

            // 3. Convertimos a CSV y descargamos
            const csv = json2csv(reportData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            saveAs(blob, `VendeloYa_Reporte_${month.replace(' ', '_')}.csv`);

            notify({ type: 'success', title: 'Reporte Generado', message: 'El archivo está listo para tu contador.', icon: 'info' });
        } catch (error) {
            console.error('Error exporting CSV:', error);
            notify({ type: 'error', title: 'Error', message: 'No se pudo generar el reporte.', icon: 'error' });
        } finally {
            setIsGenerating(false);
        }
    };

    const currentMonthLabel = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm mt-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase">Reportes Impositivos y Liquidaciones</h3>
                    <p className="text-sm text-slate-500 font-medium mt-1 text-balance">Exportá la actividad financiera (ventas completadas) para presentar ante ARCA. Ideal para trazabilidad en cuenta corriente de terceros.</p>
                </div>
                <button
                    onClick={() => exportMonthlyReport(currentMonthLabel)}
                    disabled={isGenerating}
                    className="bg-primary-vibrant text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary-600 transition-all disabled:opacity-50 min-w-[250px] shadow-lg shadow-primary-500/20 active:scale-95"
                >
                    <span className="material-symbols-outlined text-sm">download</span>
                    {isGenerating ? 'Generando y calculando...' : `Descargar ${currentMonthLabel}`}
                </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-3 shadow-inner">
                <span className="material-symbols-outlined text-amber-500">priority_high</span>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    <strong className="block mb-1 text-sm uppercase">Nota Contable - Facturación:</strong>
                    Recuerda que debes emitir <b>Factura C (o A/B según tu condición)</b> únicamente por la suma declarada en la columna <b>"Comision_VendeloYa"</b>. El resto del dinero ("Monto_a_Liquidar") se considera legalmente como "fondos de terceros en tránsito" asociados a operaciones de Escrow.
                </p>
            </div>
        </div>
    );
}
