import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// Transaction states following escrow flow
export type TransactionStatus =
    | "PENDING_PAYMENT"  // Waiting for buyer to pay
    | "PAID"             // Payment confirmed, waiting for shipment
    | "IN_TRANSIT"       // Item shipped, in delivery
    | "DELIVERED"        // Buyer received item
    | "COMPLETED"        // Buyer confirmed, funds released to seller
    | "DISPUTED"         // Issue reported
    | "CANCELLED";       // Transaction cancelled

export type PaymentMethod = 'MERCADO_PAGO' | 'TRANSFER' | 'CASH';

export interface TransactionData {
    buyerId: string;
    sellerId: string;
    itemId: string;
    itemTitle: string;
    amount: number;         // Product price
    platformFee: number;    // Platform commission (e.g., 5%)
    total: number;          // Total charged to buyer
    status: TransactionStatus;
    paymentMethod: PaymentMethod;
    deliveryMethod: 'MEETING'; // Enforce meeting
    qrCode?: string;        // Secret token for release
    mpPaymentId?: string;   // Mercado Pago payment ID (when integrated)
    escrowReleased: boolean;
    createdAt: any;
    updatedAt: any;
}

// Create a new transaction
export const createTransaction = async (data: Omit<TransactionData, 'status' | 'escrowReleased' | 'createdAt' | 'updatedAt' | 'qrCode' | 'deliveryMethod'>) => {
    try {
        const qrCode = Math.random().toString(36).substring(2, 10).toUpperCase(); // Simple random token

        const docRef = await addDoc(collection(db, "transactions"), {
            ...data,
            deliveryMethod: 'MEETING',
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

// Update transaction status
export const updateTransactionStatus = async (id: string, status: TransactionStatus) => {
    try {
        const docRef = doc(db, "transactions", id);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating transaction status:", error);
        return { success: false, error };
    }
};


// Release escrow funds to seller (Triggered by QR Scan)
export const releaseFunds = async (id: string, qrToken: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return { success: false, error: 'Transaction not found' };

        const data = docSnap.data() as TransactionData;

        if (data.qrCode !== qrToken) {
            return { success: false, error: 'Invalid QR Code' };
        }

        if (data.status === 'COMPLETED') {
            return { success: false, error: 'Funds already released' };
        }

        await updateDoc(docRef, {
            status: "COMPLETED" as TransactionStatus,
            escrowReleased: true,
            updatedAt: serverTimestamp(),
        });

        // In a real backend, here we would call Mercado Pago to split payments
        console.log("💰 RELEASE FUNDS TRIGGERED -> MP SPLIT PAYMENT EXECUTED");

        return { success: true };
    } catch (error) {
        console.error("Error releasing escrow:", error);
        return { success: false, error };
    }
};

// Get all transactions for a user (both purchases and sales)
export const getUserTransactions = async (userId: string) => {
    try {
        const transactionsRef = collection(db, "transactions");

        // 1. Fetch purchases (where user is buyer)
        const qBuy = query(
            transactionsRef,
            where("buyerId", "==", userId),
            orderBy("createdAt", "desc")
        );

        // 2. Fetch sales (where user is seller)
        const qSell = query(
            transactionsRef,
            where("sellerId", "==", userId),
            orderBy("createdAt", "desc")
        );

        const [buySnap, sellSnap] = await Promise.all([getDocs(qBuy), getDocs(qSell)]);

        const compras = buySnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'compra'
        })) as (TransactionData & { id: string, type: 'compra' })[];

        const ventas = sellSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'venta'
        })) as (TransactionData & { id: string, type: 'venta' })[];

        return { compras, ventas };
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        return { compras: [], ventas: [] };
    }
};
