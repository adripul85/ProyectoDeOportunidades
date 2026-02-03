
import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../App';
import { useAuth } from '../lib/auth';
import { GoogleGenAI } from '@google/genai';

export type EscrowStatus = 'PACTADO' | 'FONDEADO' | 'ENVIADO' | 'RECIBIDO' | 'FINALIZADO' | 'DISPUTA';
export type UserRole = 'COMPRADOR' | 'VENDEDOR' | 'MEDIADOR';


export const useEscrow = (id: string | undefined) => {
    const { notify } = useNotification();
    const { user } = useAuth();

    // --- Core States ---
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('COMPRADOR');
    const [status, setStatus] = useState<EscrowStatus>('FONDEADO');
    const [deadline, setDeadline] = useState<Date | null>(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));
    const [isVerifyingAI, setIsVerifyingAI] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const [messages, setMessages] = useState([
        { role: 'vendedor', text: '¡Hola! Ya tengo el iPhone listo. Lo embalé con doble burbuja para que llegue perfecto. 📦', time: '10:30 AM' },
        { role: 'comprador', text: '¡Genial! Muchas gracias. Quedo atento al envío.', time: '10:45 AM' }
    ]);

    const [evidence, setEvidence] = useState([
        { id: 1, url: 'https://picsum.photos/400/400?tech=1', type: 'Envío', user: 'Juan Pérez', aiVerified: true },
        { id: 2, url: 'https://picsum.photos/400/400?tech=2', type: 'Detalle', user: 'Juan Pérez', aiVerified: false }
    ]);

    const dealData = {
        id: id || 'TRX-8829',
        title: "iPhone 13 Pro Max - 128GB",
        price: 450000,
        startDate: '12 de Octubre',
        seller: {
            name: "Juan Pérez",
            avatar: "https://picsum.photos/400/400?person=1",
            reputation: "9.8",
            points: "1,240",
            level: "Vendedor Épico"
        },
        buyer: {
            name: user?.displayName || user?.email?.split('@')[0] || "Comprador",
            avatar: user?.photoURL || "https://picsum.photos/100/100?avatar=current",
            points: "450",
            level: "Buen Vecino"
        }
    };

    // --- Actions ---
    const addSystemMessage = useCallback((text: string, type: 'info' | 'warning' = 'info') => {
        setMessages(prev => [...prev, {
            role: 'sistema',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, []);

    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        setMessages(prev => [...prev, {
            role: currentUserRole.toLowerCase(),
            text: text.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        // Simulate a polite automated response or AI check
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            if (status === 'FONDEADO' && text.toLowerCase().includes('envio')) {
                addSystemMessage('🔔 Recordatorio: El vendedor debe cargar la guía de seguimiento para validar el despacho.');
            }
        }, 1500);
    };

    const toggleRole = (role: UserRole) => {
        setCurrentUserRole(role);
        notify({ type: 'info', title: `Vista de ${role}`, message: 'Cambiando perspectiva...', icon: 'sync' });

        // Organic simulation
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 800);
    };

    const updateStatus = (newStatus: EscrowStatus, adminMessage?: string) => {
        setStatus(newStatus);
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            if (adminMessage) addSystemMessage(adminMessage);
        }, 1000);
    };

    const uploadEvidence = async () => {
        setIsVerifyingAI(true);
        const newId = Date.now();
        const newUrl = `https://picsum.photos/400/400?random=${newId}`;

        setEvidence(prev => [...prev, {
            id: newId,
            url: newUrl,
            type: currentUserRole === 'VENDEDOR' ? 'Envío' : 'Recepción',
            user: currentUserRole === 'VENDEDOR' ? dealData.seller.name : 'Tú',
            aiVerified: false
        }]);

        // Simulate AI analysis
        setTimeout(() => {
            setEvidence(prev => prev.map(e => e.id === newId ? { ...e, aiVerified: true } : e));
            setIsVerifyingAI(false);
            notify({ type: 'success', title: 'IA: Foto Validada', message: 'Evidencia confirmada.', icon: 'auto_awesome' });
            addSystemMessage(`📸 Nueva evidencia cargada por ${currentUserRole === 'VENDEDOR' ? 'el Vendedor' : 'el Comprador'}.`);
        }, 2000);
    };

    return {
        dealData,
        currentUserRole,
        status,
        messages,
        evidence,
        isVerifyingAI,
        isTyping,
        deadline,
        actions: {
            toggleRole,
            sendMessage,
            updateStatus,
            uploadEvidence,
            addSystemMessage
        }
    };
};
