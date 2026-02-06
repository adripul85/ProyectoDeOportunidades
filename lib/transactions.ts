import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "./firebase";

// Transaction states following strict FSM
export type TransactionStatus =
    | "PENDING_PAYMENT"            // Waiting for buyer to pay
    | "PAID_HELD"                  // Payment confirmed, funds in escrow
    | "SHIPPED"                    // Item shipped (has tracking)
    | "DELIVERED_PENDING_REVIEW"   // Buyer received, 48h timer starts
    | "COMPLETED"                  // Funds released to seller
    | "DISPUTED"                   // Issue reported, funds locked
    | "REFUNDED"                   // Funds returned to buyer
    | "CANCELLED";                 // Transaction cancelled before payment

export type PaymentMethod = 'MERCADO_PAGO' | 'TRANSFER' | 'CASH';

export interface TransactionData {
    buyerId: string;
    sellerId: string;
    itemId: string;
    itemTitle: string;
    amount: number;
    platformFee: number;
    total: number;
    status: TransactionStatus;
    paymentMethod: PaymentMethod;
    deliveryMethod: 'SHIPPING' | 'MEETING';
    trackingId?: string;
    courier?: string;
    qrCode?: string;
    mpPaymentId?: string;
    escrowReleased: boolean;
    evidenceCount?: number;
    lastSystemMessage?: string;
    disputeStartedAt?: any;
    createdAt: any;
    updatedAt: any;
}

export interface EscrowMessage {
    id?: string;
    role: 'comprador' | 'vendedor' | 'sistema' | 'moderador';
    text: string;
    createdAt: any;
    senderId?: string;
}

export interface EscrowEvidence {
    id?: string;
    url: string;
    type: string;
    description?: string;
    uploadedBy: string;
    aiVerified: boolean;
    createdAt: any;
}

const functions = getFunctions();

// Create a new transaction
export const createTransaction = async (data: Omit<TransactionData, 'status' | 'escrowReleased' | 'createdAt' | 'updatedAt' | 'qrCode'>) => {
    try {
        const qrCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const docRef = await addDoc(collection(db, "transactions"), {
            ...data,
            // deliveryMethod is now passed in data
            qrCode: qrCode,
            status: "PENDING_PAYMENT" as TransactionStatus,
            escrowReleased: false,
            mpPaymentId: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error };
    }
};

// Get transaction by ID
export const getTransaction = async (id: string): Promise<(TransactionData & { id: string }) | null> => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as (TransactionData & { id: string });
        }
        return null;
    } catch (error) {
        console.error("Error fetching transaction:", error);
        return null;
    }
};

/**
 * SECURE: Update transaction status through Cloud Functions
 */
export const updateTransactionStatus = async (id: string, status: TransactionStatus, extraData?: any) => {
    try {
        const setStatus = httpsCallable(functions, 'updateTransactionStatus');
        const result = await setStatus({ transactionId: id, status, ...extraData });
        return result.data as { success: boolean, error?: string };
    } catch (error) {
        console.error("Error calling setStatus function:", error);
        return { success: false, error };
    }
};

/**
 * SECURE: Release funds via Cloud Function
 */
export const releaseFunds = async (id: string, qrToken?: string) => {
    try {
        const release = httpsCallable(functions, 'releaseFunds');
        const result = await release({ transactionId: id, qrToken });
        return result.data as { success: boolean, error?: string };
    } catch (error) {
        console.error("Error calling releaseFunds function:", error);
        return { success: false, error };
    }
};

/**
 * SECURE: Update tracking information
 */
export const updateTracking = async (id: string, trackingId: string, courier: string) => {
    try {
        const update = httpsCallable(functions, 'updateTracking');
        const result = await update({ transactionId: id, trackingId, courier });
        return result.data as { success: boolean, error?: string };
    } catch (error) {
        console.error("Error calling updateTracking function:", error);
        return { success: false, error };
    }
};

// Get all transactions for a user
export const getUserTransactions = async (userId: string) => {
    try {
        const transactionsRef = collection(db, "transactions");

        const qBuy = query(transactionsRef, where("buyerId", "==", userId), orderBy("createdAt", "desc"));
        const qSell = query(transactionsRef, where("sellerId", "==", userId), orderBy("createdAt", "desc"));

        const [buySnap, sellSnap] = await Promise.all([getDocs(qBuy), getDocs(qSell)]);

        const compras = buySnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'compra' })) as (TransactionData & { id: string, type: 'compra' })[];
        const ventas = sellSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'venta' })) as (TransactionData & { id: string, type: 'venta' })[];

        return { compras, ventas };
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        return { compras: [], ventas: [] };
    }
};

// Subscribe to real-time transaction updates
export const subscribeToTransaction = (id: string, callback: (data: any) => void) => {
    const docRef = doc(db, "transactions", id);
    return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() });
        }
    });
};

/**
 * Real-time Escrow Chat subscription
 */
export const subscribeToEscrowMessages = (transactionId: string, callback: (messages: EscrowMessage[]) => void) => {
    const q = query(
        collection(db, "transactions", transactionId, "messages"),
        orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EscrowMessage[];
        callback(messages);
    });
};

/**
 * Real-time Evidence subscription
 */
export const subscribeToEvidence = (transactionId: string, callback: (evidence: EscrowEvidence[]) => void) => {
    const q = query(
        collection(db, "transactions", transactionId, "evidence"),
        orderBy("createdAt", "desc")
    );
    return onSnapshot(q, (snapshot) => {
        const evidence = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as EscrowEvidence[];
        callback(evidence);
    });
};

/**
 * Send a message within the escrow context
 */
export const sendEscrowNote = async (transactionId: string, role: EscrowMessage['role'], text: string, senderId?: string) => {
    try {
        const sendNote = httpsCallable(functions, 'addEscrowNote');
        const result = await sendNote({ transactionId, role, text, senderId });
        return result.data as { success: boolean, error?: string };
    } catch (error) {
        console.error("Error calling addEscrowNote function:", error);
        return { success: false, error };
    }
};

/**
 * Register evidence (photo) for a transaction
 */
export const submitEvidence = async (transactionId: string, url: string, type: string, description?: string) => {
    try {
        const submit = httpsCallable(functions, 'submitEvidence');
        const result = await submit({ transactionId, url, type, description });
        return result.data as { success: boolean, error?: string };
    } catch (error) {
        console.error("Error calling submitEvidence function:", error);
        return { success: false, error };
    }
};
