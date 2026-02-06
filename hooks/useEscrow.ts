
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNotification } from '../App';
import { useAuth } from '../lib/auth';
import {
    TransactionData,
    TransactionStatus,
    subscribeToTransaction,
    updateTransactionStatus,
    releaseFunds,
    updateTracking,
    subscribeToEscrowMessages,
    subscribeToEvidence,
    sendEscrowNote,
    submitEvidence,
    EscrowMessage,
    EscrowEvidence
} from '../lib/transactions';
import { uploadFile } from '../lib/storage';

export type UserRole = 'COMPRADOR' | 'VENDEDOR' | 'MEDIADOR';

export const useEscrow = (id: string | undefined) => {
    const { notify } = useNotification();
    const { user } = useAuth();

    // --- Core States ---
    const [transaction, setTransaction] = useState<TransactionData & { id: string } | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>('COMPRADOR');
    const [isVerifyingAI, setIsVerifyingAI] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const [messages, setMessages] = useState<EscrowMessage[]>([]);
    const [evidence, setEvidence] = useState<EscrowEvidence[]>([]);

    // Derived values
    const status = transaction?.status || 'PENDING_PAYMENT';
    const deadline = useMemo(() => {
        if (!transaction?.createdAt) return null;
        const start = transaction.createdAt.toDate ? transaction.createdAt.toDate() : new Date();
        return new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
    }, [transaction]);

    const dealData = useMemo(() => ({
        id: id || '...',
        title: transaction?.itemTitle || "Cargando protocolo...",
        price: transaction?.amount || 0,
        startDate: transaction?.createdAt?.toDate ? transaction.createdAt.toDate().toLocaleDateString() : '...',
        seller: {
            name: "Vendedor #" + (transaction?.sellerId?.substring(0, 4) || '...'),
            avatar: "https://picsum.photos/400/400?person=1",
            reputation: "9.8",
            points: "1,240",
            level: "Vendedor Épico"
        },
        buyer: {
            name: user?.displayName || user?.email?.split('@')[0] || "Comprador",
            avatar: user?.photoURL || "https://ui-avatars.com/api/?name=User",
            points: "450",
            level: "Buen Vecino"
        }
    }), [transaction, id, user]);

    // --- Subscription ---
    useEffect(() => {
        if (!id) return;

        // Main Transaction Subscription
        const unsubTx = subscribeToTransaction(id, (data) => {
            setTransaction(data);
        });

        // Messages Subscription
        const unsubMsgs = subscribeToEscrowMessages(id, (data) => {
            setMessages(data);
            setTimeout(scrollToBottom, 100);
        });

        // Evidence Subscription
        const unsubEvidence = subscribeToEvidence(id, (data) => {
            setEvidence(data);
        });

        return () => {
            unsubTx();
            unsubMsgs();
            unsubEvidence();
        };
    }, [id]);

    const scrollToBottom = () => {
        const chatContainer = document.getElementById('escrow-chat-container');
        if (chatContainer) {
            chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        }
    };

    // --- Actions ---
    const addSystemMessage = useCallback((text: string) => {
        setMessages(prev => [...prev, {
            role: 'sistema',
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    }, []);

    const sendMessage = async (text: string) => {
        if (!text.trim() || !id) return;
        const role = currentUserRole.toLowerCase() as EscrowMessage['role'];
        await sendEscrowNote(id, role, text.trim(), user?.uid);
    };

    const toggleRole = (role: UserRole) => {
        setCurrentUserRole(role);
        notify({ type: 'info', title: `Simulación de ${role}`, message: 'Cambiando rol local...', icon: 'sync' });
    };

    const updateStatus = async (newStatus: TransactionStatus, adminMessage?: string) => {
        if (!id) return;
        setIsTyping(true);
        const result = await updateTransactionStatus(id, newStatus);
        setIsTyping(false);

        if (result.success) {
            if (adminMessage) addSystemMessage(adminMessage);
        } else {
            notify({ type: 'error', title: 'Error de Protocolo', message: result.error || 'No se pudo actualizar el estado.', icon: 'error' });
        }
    };

    const releaseEscrow = async (qrToken?: string) => {
        if (!id) return;
        setIsTyping(true);
        const result = await releaseFunds(id, qrToken);
        setIsTyping(false);

        if (result.success) {
            notify({ type: 'success', title: 'Fondos Liberados', message: 'El capital ha sido transferido al vendedor.', icon: 'payments' });
        } else {
            notify({ type: 'error', title: 'Fallo de Liberación', message: result.error || 'Verifica el token o las condiciones.', icon: 'lock_open' });
        }
    };

    const registerTracking = async (trackingId: string, courier: string) => {
        if (!id) return;
        setIsTyping(true);
        const result = await updateTracking(id, trackingId, courier);
        setIsTyping(false);

        if (result.success) {
            notify({ type: 'success', title: 'Tracking Registrado', message: 'El envío ha sido validado.', icon: 'local_shipping' });
        } else {
            notify({ type: 'error', title: 'Error de Seguimiento', message: result.error || 'ID de seguimiento inválido.', icon: 'error' });
        }
    };

    const uploadEvidence = async (file: File, type: string = 'General') => {
        if (!id) return;
        setIsVerifyingAI(true);
        try {
            const url = await uploadFile(file, `escrow/${id}`);
            await submitEvidence(id, url, type, `Evidencia cargada por el ${currentUserRole}`);

            // Mensaje automático al chat del protocolo
            await sendEscrowNote(id, 'sistema', `📸 El ${currentUserRole.toLowerCase()} ha certificado una nueva evidencia. El proceso de liberación ya está disponible.`, user?.uid);

            notify({ type: 'success', title: 'Evidencia Cargada', message: 'La foto ha sido adjunta al registro seguro.', icon: 'auto_awesome' });
        } catch (error) {
            console.error("Error uploading evidence:", error);
            notify({ type: 'error', title: 'Error de Carga', message: 'No se pudo subir la evidencia.', icon: 'error' });
        } finally {
            setIsVerifyingAI(false);
        }
    };

    return {
        transaction,
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
            releaseEscrow,
            registerTracking,
            uploadEvidence,
            addSystemMessage
        }
    };
};
