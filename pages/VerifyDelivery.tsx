import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getTransaction, releaseFunds } from '../lib/transactions';
import { useNotification } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';

export default function VerifyDelivery() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const txId = searchParams.get('txId');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notify } = useNotification();

    const [txData, setTxData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function load() {
            if (!txId) {
                setLoading(false);
                return;
            }
            const data = await getTransaction(txId);
            setTxData(data);
            setLoading(false);
        }
        load();
    }, [txId]);

    const handleConfirm = async () => {
        if (!txId || !token) return;
        setProcessing(true);
        const result = await releaseFunds(txId, token);

        if (result.success) {
            notify({ type: 'success', title: '¡Entrega Confirmada!', message: 'Los fondos han sido liberados a tu cuenta.', icon: 'verified' });
            navigate('/dashboard');
        } else {
            notify({ type: 'error', title: 'Error', message: 'Token inválido o expirado.', icon: 'error' });
            setProcessing(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

    if (!txData || !token) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
            <span className="material-symbols-outlined text-6xl text-red-400 mb-4">link_off</span>
            <h1 className="text-2xl font-black text-dark-800">Enlace Inválido</h1>
            <p className="text-sm font-bold text-gray-400 mt-2">Falta información para verificar la entrega.</p>
            <button onClick={() => navigate('/')} className="mt-8 btn-primary">Volver al Inicio</button>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-light-50 p-6">
            <div className="bg-white max-w-md w-full p-8 rounded-[40px] border border-light-200 shadow-premium text-center">
                <div className="size-20 bg-primary-50 text-primary-vibrant rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl font-black">qr_code_scanner</span>
                </div>

                <h1 className="text-2xl font-black text-dark-800 mb-2">Verificar Entrega</h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Confirma que has entregado el activo.</p>

                <div className="bg-light-50 p-6 rounded-3xl border border-light-100 mb-8 space-y-4">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Activo</p>
                        <p className="text-lg font-black text-dark-800">{txData.itemTitle}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total a Liberar</p>
                        <p className="text-2xl font-black text-emerald-600">${txData.total?.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Siguiente Paso</p>
                        <p className="text-xs font-bold text-dark-800">Los fondos se acreditarán en tu billetera de inmediato.</p>
                    </div>
                </div>

                {!user ? (
                    <button onClick={() => navigate(`/login?redirect=/verify-delivery?token=${token}&txId=${txId}`)} className="w-full btn-primary h-14">
                        Iniciar Sesión para Confirmar
                    </button>
                ) : (
                    <button
                        onClick={handleConfirm}
                        disabled={processing}
                        className="w-full btn-primary h-14 flex items-center justify-center gap-2"
                    >
                        {processing ? 'Procesando...' : 'Confirmar Entrega y Cobrar'}
                    </button>
                )}
            </div>
        </div>
    );
}
