
import React, { useState } from 'react';
import { UserRole } from '../../hooks/useEscrow';

interface Message {
    role: string;
    text: string;
    time: string;
}


interface Props {
    messages: Message[];
    currentUserRole: UserRole;
    onSendMessage: (text: string) => void;
    onDownload: () => void;
    isTyping: boolean;
}


const EscrowChat: React.FC<Props> = ({ messages, currentUserRole, onSendMessage, onDownload, isTyping }) => {
    const [input, setInput] = useState('');
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    return (
        <section className="bg-white rounded-[40px] overflow-hidden flex flex-col h-[650px] border border-light-200 shadow-premium relative">
            <div className="bg-dark-800 p-8 flex items-center justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-primary-vibrant/5 blur-[40px]"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="size-10 bg-primary-vibrant/10 text-primary-vibrant rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined font-black">shield_lock</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-none text-white/40 mb-1.5">Secure Protocol Channel</p>
                        <p className="text-[9px] text-primary-vibrant font-black uppercase tracking-widest">Encrypted Auth • {currentUserRole}</p>
                    </div>
                </div>
                <button
                    onClick={onDownload}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-3 transition-all border border-white/10 relative z-10"
                >
                    <span className="material-symbols-outlined text-sm">history_edu</span>
                    Protocol Logs
                </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-light-50/20 scroll-smooth">
                {messages.map((m, idx) => (
                    <div key={idx} className={`flex flex-col ${m.role === 'sistema' ? 'items-center' : m.role === currentUserRole.toLowerCase() ? 'items-end' : 'items-start'}`}>
                        {m.role === 'sistema' ? (
                            <div className="bg-white/50 px-8 py-3 rounded-2xl border border-light-200/50 my-2 shadow-sm max-w-[90%] text-center backdrop-blur-sm">
                                <p className="text-[9px] font-black text-primary-vibrant uppercase tracking-[0.2em] leading-relaxed">{m.text}</p>
                            </div>
                        ) : (
                            <div className="max-w-[80%] flex flex-col">
                                <div className={`p-6 rounded-[32px] shadow-sm text-sm font-bold leading-relaxed tracking-tight ${m.role === currentUserRole.toLowerCase() ? 'bg-dark-800 text-white rounded-tr-none' : 'bg-white text-dark-800 border border-light-200 rounded-tl-none'}`}>
                                    {m.text}
                                </div>
                                <div className={`flex items-center gap-3 mt-3 px-2 ${m.role === currentUserRole.toLowerCase() ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-[8px] font-black uppercase tracking-[0.3em] ${m.role === currentUserRole.toLowerCase() ? 'text-primary-vibrant' : 'text-gray-300'}`}>{m.role}</span>
                                    <div className="size-1 bg-gray-200 rounded-full"></div>
                                    <span className="text-[9px] font-black text-gray-300 tracking-tighter">{m.time}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white border border-light-200 p-6 rounded-[24px] rounded-tl-none flex gap-1.5 items-center shadow-sm">
                            <div className="size-1.5 bg-primary-vibrant rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="size-1.5 bg-primary-vibrant rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="size-1.5 bg-primary-vibrant rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-light-200 flex gap-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter protocol updates..."
                    className="flex-1 bg-light-50 border border-light-200 rounded-2xl px-6 py-5 text-sm font-bold text-dark-800 placeholder:text-gray-300 focus:bg-white focus:border-primary-vibrant focus:ring-4 focus:ring-primary-vibrant/5 transition-all outline-none"
                />
                <button className="size-[60px] bg-dark-800 text-white rounded-2xl hover:bg-dark-900 transition-all flex items-center justify-center shadow-xl shadow-dark-800/10 active:scale-95 shrink-0">
                    <span className="material-symbols-outlined text-2xl font-black">send</span>
                </button>
            </form>
        </section>
    );
};

export default EscrowChat;
