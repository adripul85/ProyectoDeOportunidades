
import React, { useState, useEffect } from 'react';
import { EscrowStatus } from '../../hooks/useEscrow';

interface Props {
    status: EscrowStatus;
    deadline: Date | null;
}


const EscrowStatusDisplay: React.FC<Props> = ({ status, deadline }) => {
    const [timeLeft, setTimeLeft] = useState('');

    const steps: { status: EscrowStatus; label: string; icon: string; desc: string }[] = [
        { status: 'PACTADO', label: 'Initialized', icon: 'handshake', desc: 'Protocol agreement' },
        { status: 'FONDEADO', label: 'Protected', icon: 'shield_lock', desc: 'Secure escrow lock' },
        { status: 'ENVIADO', label: 'In Transit', icon: 'local_shipping', desc: 'Asset dispatched' },
        { status: 'RECIBIDO', label: 'Delivered', icon: 'inventory_2', desc: 'Handover complete' },
        { status: 'FINALIZADO', label: 'Settled', icon: 'task_alt', desc: 'Contract terminated' }
    ];

    const currentStepIdx = steps.findIndex(s => s.status === status);

    useEffect(() => {
        if (!deadline || status === 'FINALIZADO' || status === 'DISPUTA') return;
        const interval = setInterval(() => {
            const distance = deadline.getTime() - new Date().getTime();
            if (distance < 0) {
                setTimeLeft('EXPIRED');
                clearInterval(interval);
            } else {
                const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${d}d ${h}h ${m}m`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline, status]);

    return (
        <div className="bg-white p-10 rounded-[40px] border border-light-200 shadow-premium flex flex-col items-center">

            <div className="w-full flex justify-between items-center mb-12">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Protocol Status</h3>
                {timeLeft && status !== 'FINALIZADO' && status !== 'DISPUTA' && (
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100/50">
                        <span className="material-symbols-outlined text-sm text-amber-500 font-black">timer</span>
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest">{timeLeft}</span>
                    </div>
                )}
            </div>

            <div className="relative size-56 mb-12 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-[10px] ${status === 'DISPUTA' ? 'border-red-50' : 'border-light-50'}`}></div>
                <div
                    className={`absolute inset-0 rounded-full border-[10px] transition-all duration-1000 ${status === 'DISPUTA' ? 'border-red-500 shadow-lg shadow-red-500/20' : 'border-dark-800 shadow-lg shadow-dark-800/10'}`}
                    style={{
                        clipPath: `inset(0 0 0 0)`,
                        maskImage: `conic-gradient(black ${((currentStepIdx + 1) / steps.length) * 100}%, transparent 0)`
                    }}
                ></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className={`size-20 rounded-3xl flex items-center justify-center mb-4 ${status === 'DISPUTA' ? 'bg-red-50 text-red-500' : 'bg-light-50 text-dark-800'} shadow-sm border border-light-200`}>
                        <span className="material-symbols-outlined text-4xl font-black">
                            {status === 'DISPUTA' ? 'gavel' : steps[currentStepIdx > -1 ? currentStepIdx : 0].icon}
                        </span>
                    </div>
                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.3em]">
                        {status === 'DISPUTA' ? 'Active Dispute' : steps[currentStepIdx > -1 ? currentStepIdx : 0].label}
                    </span>
                </div>
            </div>

            <div className="w-full space-y-4 mb-12">
                <div className="h-2 bg-light-50 rounded-full overflow-hidden border border-light-100/50">
                    <div
                        className={`h-full transition-all duration-1000 ${status === 'DISPUTA' ? 'bg-red-500' : 'bg-primary-vibrant'}`}
                        style={{ width: `${((currentStepIdx + 1) / steps.length) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.5em] text-gray-300">
                    <span>Protocol Start</span>
                    <span>Settlement</span>
                </div>
            </div>

            <div className="w-full space-y-6 pt-10 border-t border-light-100/50">
                {steps.map((step, idx) => (
                    <div key={idx} className={`flex items-center gap-6 ${idx > currentStepIdx ? 'opacity-20 grayscale' : ''} transition-all duration-500`}>
                        <div className={`size-10 rounded-xl flex items-center justify-center border-2 transition-all ${idx <= currentStepIdx ? 'bg-dark-800 border-dark-800 text-white shadow-md' : 'bg-white border-light-200 text-gray-300'}`}>
                            <span className="material-symbols-outlined text-sm font-black">{idx < currentStepIdx ? 'check' : step.icon}</span>
                        </div>
                        <div className="text-left flex-1">
                            <p className="text-[11px] font-black text-dark-800 uppercase tracking-tight leading-none">{step.label}</p>
                            <p className="text-[9px] font-bold text-gray-400 mt-1.5 uppercase tracking-wide">{step.desc}</p>
                        </div>
                        {idx === currentStepIdx && status !== 'FINALIZADO' && status !== 'DISPUTA' && (
                            <div className="size-2 bg-primary-vibrant rounded-full animate-ping"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EscrowStatusDisplay;
