import React from 'react';
import QRCode from 'react-qr-code';

interface TransactionQRProps {
    value: string;
    label?: string;
}

export const TransactionQR: React.FC<TransactionQRProps> = ({ value, label }) => {
    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-3xl shadow-sm border border-light-200">
            <div className="bg-white p-4 rounded-xl border-2 border-dashed border-light-200 mb-4">
                <QRCode
                    value={value}
                    size={180}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 256 256`}
                />
            </div>
            {label && (
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Código de Seguridad</p>
                    <p className="text-2xl font-black text-dark-800 font-mono tracking-tighter">{value}</p>
                </div>
            )}
        </div>
    );
};
