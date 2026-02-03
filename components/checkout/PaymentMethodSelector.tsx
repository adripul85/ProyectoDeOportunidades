import React from 'react';
import { PaymentMethod } from '../../lib/transactions';

interface Props {
    selectedMethod: PaymentMethod;
    onSelect: (method: PaymentMethod) => void;
}

const PaymentMethodSelector: React.FC<Props> = ({ selectedMethod, onSelect }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Selecciona tu método de pago</h3>

            {/* Mercado Pago */}
            <div
                onClick={() => onSelect('MERCADO_PAGO')}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 hover:shadow-md ${selectedMethod === 'MERCADO_PAGO'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-border-light bg-white hover:border-gray-300'
                    }`}
            >
                <div className="size-10 rounded-full bg-white border border-gray-100 flex items-center justify-center shrink-0 p-1">
                    <img
                        src="https://logotipoz.com/wp-content/uploads/2021/10/version-horizontal-large-logo-mercado-pago.webp"
                        alt="Mercado Pago"
                        className="w-full object-contain"
                    />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-dark-charcoal">Mercado Pago</h4>
                        {selectedMethod === 'MERCADO_PAGO' && <span className="material-symbols-outlined text-blue-600">check_circle</span>}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Tarjetas de crédito, débito y dinero en cuenta. Acreditación instantánea.
                    </p>
                </div>
            </div>

            {/* Transferencia */}
            <div
                onClick={() => onSelect('TRANSFER')}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 hover:shadow-md ${selectedMethod === 'TRANSFER'
                        ? 'border-dark-charcoal bg-gray-50'
                        : 'border-border-light bg-white hover:border-gray-300'
                    }`}
            >
                <div className="size-10 rounded-full bg-light-50 border border-border-light flex items-center justify-center shrink-0 text-dark-charcoal">
                    <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-dark-charcoal">Transferencia Bancaria</h4>
                        {selectedMethod === 'TRANSFER' && <span className="material-symbols-outlined text-dark-charcoal">check_circle</span>}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Transfiere directamente a nuestra cuenta de custodia. Procesamiento en 1-2 horas hábiles.
                    </p>
                </div>
            </div>

            {/* Efectivo */}
            <div
                onClick={() => onSelect('CASH')}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-4 hover:shadow-md ${selectedMethod === 'CASH'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-border-light bg-white hover:border-gray-300'
                    }`}
            >
                <div className="size-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600">
                    <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-dark-charcoal">Efectivo / Punto de Encuentro</h4>
                        {selectedMethod === 'CASH' && <span className="material-symbols-outlined text-emerald-600">check_circle</span>}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Acuerdas el pago directamente con el vendedor al momento de la entrega.
                    </p>
                </div>
            </div>

            <div className="bg-primary-50 p-4 rounded-lg flex gap-3 items-start border border-primary-100 mt-6">
                <span className="material-symbols-outlined text-primary-600 shrink-0">info</span>
                <p className="text-xs text-primary-800 leading-relaxed">
                    <strong>Importante:</strong> Independientemente del método, tu compra está protegida por nuestra Garantía de Satisfacción.
                </p>
            </div>

        </div>
    );
};

export default PaymentMethodSelector;
