import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "./firebase";
import { getSystemAdminId } from "./admin";
import { getPlatformSettings } from "./settings";

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

export type PaymentMethod = 'MERCADO_PAGO' | 'TRANSFER' | 'CASH' | 'MODO';

export interface TransactionData {
    buyerId: string;
    sellerId: string;
    itemId: string;
    itemTitle: string;
    itemImage?: string;
    amount: number;             // Legacy compatibility (maps to amountProduct)
    amountProduct: number;      // Item price
    amountGatewayFee: number;   // Processor fee (MP, etc.)
    amountPlatformFee: number;  // Fixed Escrow protection fee ($2500)
    amountTotal: number;        // Final paid amount
    platformFee: number;        // Legacy compatibility (maps to amountPlatformFee)
    total: number;              // Legacy compatibility (maps to amountTotal)
    status: TransactionStatus;
    paymentMethod: PaymentMethod;
    deliveryMethod: 'correo_argentino' | 'en_mano' | 'acordar' | 'domicilio';
    trackingId?: string;
    courier?: string;
    qrCode?: string;
    mpPaymentId?: string;
    payoutStatus?: 'PENDING' | 'SENT' | 'ACKNOWLEDGED';
    escrowReleased: boolean;
    evidenceCount?: number;
    shippingEvidence?: string[]; // URLs of photos uploaded by seller
    deliveryEvidence?: string[]; // URLs of photos uploaded by buyer
    lastSystemMessage?: string;
    notes?: string;
    deliveredAt?: any;           // Precise time when product was deliveried/received
    inspectionDeadline?: any;    // Time when auto-release occurs (normally deliveredAt + 48h)
    disputeReason?: string;
    isAmicableReturnAccepted?: boolean;
    returnTrackingId?: string;
    returnCourier?: string;
    disputeStartedAt?: any;
    featuredFeeApplied?: number;
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
export const createTransaction = async (data: Omit<TransactionData, 'status' | 'escrowReleased' | 'createdAt' | 'updatedAt' | 'qrCode' | 'platformFee' | 'total' | 'amountPlatformFee' | 'amountTotal' | 'amountGatewayFee'> & { gatewayFee?: number, platformFee?: number }) => {
    try {
        const qrCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        const settings = await getPlatformSettings();

        // NEW MODEL: Dynamic Fees from Settings
        const productPrice = data.amountProduct || data.amount;

        const platformProtectionFee = data.platformFee || (settings.useFixedEscrowFee
            ? (settings.escrowFixedFee ?? 2500)
            : Math.round(productPrice * settings.escrowFeePercentage));

        // Estimate Gateway Fee if not provided
        const estimatedGatewayFee = data.gatewayFee || Math.round(productPrice * settings.paymentProcessingFeePercentage);
        const totalToPay = productPrice + platformProtectionFee + estimatedGatewayFee;

        const docRef = await addDoc(collection(db, "transactions"), {
            ...data,
            amount: productPrice, // legacy
            amountProduct: productPrice,
            amountPlatformFee: platformProtectionFee,
            amountGatewayFee: estimatedGatewayFee,
            amountTotal: totalToPay,
            platformFee: platformProtectionFee, // legacy
            total: totalToPay, // legacy
            qrCode: qrCode,
            featuredFeeApplied: data.featuredFeeApplied || null,
            status: "PENDING_PAYMENT" as TransactionStatus,
            escrowReleased: false,
            mpPaymentId: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        // NOTE: We don't log BUY_DEDUCTION yet because payment is pending.
        // This will be handled in updateTransactionStatus when it moves to PAID_HELD.

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating transaction:", error);
        return { success: false, error };
    }
};

// Get transaction by ID
export const getTransaction = async (id: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as TransactionData & { id: string };
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

        // NEW: Calculate deadlines and timestamps for escrow logic
        const updateData: any = {
            status,
            updatedAt: serverTimestamp()
        };

        if (status === 'DELIVERED_PENDING_REVIEW') {
            const now = new Date();
            const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
            updateData.deliveredAt = serverTimestamp();
            updateData.inspectionDeadline = deadline;
        }

        if (status === 'DISPUTED') {
            updateData.disputeStartedAt = serverTimestamp();
        }

        if (status === 'PAID_HELD') {
            const { getTransaction } = await import("./transactions");
            const tx = await getTransaction(id);
            if (tx) {
                const { logWalletMovement } = await import("./users");
                // 1. Buyer: Full deduction (Total paid)
                await logWalletMovement({
                    uid: tx.buyerId,
                    type: 'BUY_DEDUCTION',
                    amount: tx.amountTotal,
                    referenceId: id,
                    itemTitle: tx.itemTitle,
                    description: `Pago procesado: ${tx.itemTitle}`
                });
                // 2. Seller: Escrow Hold (Product price)
                await logWalletMovement({
                    uid: tx.sellerId,
                    type: 'ESCROW_HOLD',
                    amount: tx.amountProduct,
                    referenceId: id,
                    itemTitle: tx.itemTitle,
                    description: `Fondos en garantía: ${tx.itemTitle}`
                });
            }
        }

        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, updateData)
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error updating transaction status:", error);
        return { success: false, error: error.message };
    }
};

/**
 * SECURE: Release funds (Cloud Function ONLY)
 * Directs funds securely and updates wallets in a single transaction
 */
export const releaseFunds = async (id: string, qrToken?: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return { success: false, error: 'Transacción no encontrada' };
        const data = docSnap.data() as TransactionData;

        // 1. Execute secure cloud function
        const releaseFundsFunc = httpsCallable(functions, 'releaseFunds');
        await releaseFundsFunc({ transactionId: id, qrToken });

        // Trigger reputation recalculation purely on the frontend (non-critical client update)
        try {
            const { recalculateReputation } = await import("./users");
            await recalculateReputation(data.sellerId);
        } catch (repError) {
            console.warn("Failed to recalculate reputation locally:", repError);
        }

        return { success: true };

    } catch (error: any) {
        console.error("Error releasing funds via Cloud Function:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Seller accepts an amicable return of the product.
 */
export const acceptAmicableReturn = async (id: string, sellerId: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                isAmicableReturnAccepted: true,
                status: 'PAID_HELD', // Reverse state to allow return confirmation
                lastSystemMessage: '🤝 El vendedor ha aceptado la devolución amigable. El comprador debe proceder con el envío de retorno.',
                updatedAt: serverTimestamp()
            })
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error accepting return:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Seller confirms receipt of the returned item.
 */
export const confirmReturnReceipt = async (id: string, sellerId: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                status: 'REFUNDED',
                lastSystemMessage: '📦 El vendedor ha confirmado la recepción del retorno. Reembolso procesado.',
                updatedAt: serverTimestamp()
            })
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error confirming return receipt:", error);
        return { success: false, error: error.message };
    }
};

/**
 * ADMIN: Refund funds to buyer (Official resolution)
 */
export const adminRefundFunds = async (id: string, adminId: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                status: 'REFUNDED',
                lastSystemMessage: `⚖️ Resolución Administrativa: Reembolso completo emitido al Comprador por el administrador #${adminId?.slice(0, 5)}.`,
                updatedAt: serverTimestamp()
            })
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error in admin refund:", error);
        return { success: false, error: error.message };
    }
};

/**
 * CANCEL Transaction (with 3% Penalty logic)
 */
export const cancelTransaction = async (id: string, cancelledByUid: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return { success: false, error: 'Transaction not found' };

        const data = docSnap.data() as TransactionData;

        // Define Fee
        const penaltyRate = 0.03;
        const penaltyAmount = data.amount * penaltyRate;
        const refundAmount = data.amount - penaltyAmount;
        const isSeller = cancelledByUid === data.sellerId;

        // Message
        const systemMessage = isSeller
            ? `Cancelado por el vendedor. Se aplicó una penalización del 3% ($${penaltyAmount}).`
            : `Cancelado por el comprador. Se descontó 3% ($${penaltyAmount}) por gastos de servicio escrow.`;

        // Update Transaction
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                status: 'CANCELLED',
                updatedAt: serverTimestamp(),
                lastSystemMessage: systemMessage
            })
        );

        // MONEY MOVEMENT
        const { getSystemAdminId } = await import('./admin');
        const adminId = await getSystemAdminId();
        const adminRef = adminId ? doc(db, "users", adminId) : null;

        if (isSeller) {
            // SELLER CANCELLED: Full Refund to Buyer, Penalty to Seller
            // 1. Refund Buyer 100%
            const buyerRef = doc(db, "users", data.buyerId);
            await import("firebase/firestore").then(({ updateDoc, increment }) =>
                updateDoc(buyerRef, { "wallet.available": increment(data.amount) })
            );

            // 2. Charge Seller Penalty
            const sellerRef = doc(db, "users", data.sellerId);
            await import("firebase/firestore").then(({ updateDoc, increment }) =>
                updateDoc(sellerRef, { "wallet.available": increment(-penaltyAmount) })
            );

            // 3. Credit Admin
            if (adminRef) {
                await import("firebase/firestore").then(({ updateDoc, increment }) =>
                    updateDoc(adminRef, { "wallet.available": increment(penaltyAmount) })
                );

                // LOG PENALTY
                await addDoc(collection(db, "financial_logs"), {
                    transactionId: id,
                    type: 'cancellation_penalty',
                    amount: penaltyAmount,
                    currency: 'ARS',
                    relatedUser: data.sellerId,
                    timestamp: serverTimestamp()
                });

                // NEW: Admin Wallet Movement (Penalty)
                const { logWalletMovement } = await import('./users');
                await logWalletMovement({
                    uid: adminId,
                    type: 'PLATFORM_REVENUE',
                    amount: penaltyAmount,
                    referenceId: id,
                    itemTitle: data.itemTitle,
                    description: `Penalización Cancelación Vent.: ${data.itemTitle}`
                });
            }

        } else {
            // BUYER CANCELLED: Refund - Penalty
            // 1. Refund Buyer (97%)
            const buyerRef = doc(db, "users", data.buyerId);
            await import("firebase/firestore").then(({ updateDoc, increment }) =>
                updateDoc(buyerRef, { "wallet.available": increment(refundAmount) })
            );

            // 2. Credit Admin (3% Fee from Escrow)
            if (adminRef) {
                await import("firebase/firestore").then(({ updateDoc, increment }) =>
                    updateDoc(adminRef, { "wallet.available": increment(penaltyAmount) })
                );

                // LOG PENALTY
                await addDoc(collection(db, "financial_logs"), {
                    transactionId: id,
                    type: 'cancellation_penalty',
                    amount: penaltyAmount,
                    currency: 'ARS',
                    relatedUser: data.buyerId,
                    timestamp: serverTimestamp()
                });

                // NEW: Admin Wallet Movement (Penalty)
                const { logWalletMovement } = await import('./users');
                await logWalletMovement({
                    uid: adminId,
                    type: 'PLATFORM_REVENUE',
                    amount: penaltyAmount,
                    referenceId: id,
                    itemTitle: data.itemTitle,
                    description: `Penalización Cancelación Compr.: ${data.itemTitle}`
                });
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error cancelling transaction:", error);
        return { success: false, error: error.message };
    }
};

/**
 * SECURE: Update tracking information with Fallback
 */
export const updateTracking = async (id: string, trackingId: string, courier: string) => {
    try {
        const docRef = doc(db, "transactions", id);
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                status: 'SHIPPED',
                trackingId,
                courier,
                updatedAt: serverTimestamp()
            })
        );
        return { success: true };
    } catch (error: any) {
        console.error("Error updating tracking:", error);
        return { success: false, error: error.message };
    }
};

// Get all transactions for a user
export const getUserTransactions = async (userId: string) => {
    try {
        const transactionsRef = collection(db, "transactions");
        const withdrawalsRef = collection(db, "withdrawals");

        const qBuy = query(transactionsRef, where("buyerId", "==", userId), orderBy("createdAt", "desc"));
        const qSell = query(transactionsRef, where("sellerId", "==", userId), orderBy("createdAt", "desc"));
        const qWithdrawals = query(withdrawalsRef, where("uid", "==", userId), orderBy("createdAt", "desc"));

        const [buySnap, sellSnap, withdrawSnap] = await Promise.all([
            getDocs(qBuy),
            getDocs(qSell),
            getDocs(qWithdrawals)
        ]);

        const compras = buySnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'compra' })) as (TransactionData & { id: string, type: 'compra' })[];
        const ventas = sellSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'venta' })) as (TransactionData & { id: string, type: 'venta' })[];
        const retiros = withdrawSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'retiro' })) as any[];

        return { compras, ventas, retiros };
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        return { compras: [], ventas: [], retiros: [] };
    }
};

// Subscribe to real-time user transactions
export const subscribeToUserTransactions = (userId: string, callback: (data: { compras: any[], ventas: any[], retiros: any[] }) => void) => {
    const transactionsRef = collection(db, "transactions");
    const withdrawalsRef = collection(db, "withdrawals");

    const qBuy = query(transactionsRef, where("buyerId", "==", userId), orderBy("createdAt", "desc"));
    const qSell = query(transactionsRef, where("sellerId", "==", userId), orderBy("createdAt", "desc"));
    const qWithdrawals = query(withdrawalsRef, where("uid", "==", userId), orderBy("createdAt", "desc"));

    let data = { compras: [], ventas: [], retiros: [] };

    const update = () => callback({ ...data });

    const unsubBuy = onSnapshot(qBuy, (snap) => {
        data.compras = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        update();
    });

    const unsubSell = onSnapshot(qSell, (snap) => {
        data.ventas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        update();
    });

    const unsubWithdrawals = onSnapshot(qWithdrawals, (snap) => {
        data.retiros = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        update();
    });

    return () => {
        unsubBuy();
        unsubSell();
        unsubWithdrawals();
    };
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
 * Send a message within the escrow context (Direct Write)
 */
export const sendEscrowNote = async (transactionId: string, role: EscrowMessage['role'], text: string, senderId?: string) => {
    try {
        const docRef = doc(db, "transactions", transactionId);
        const msgsRef = collection(docRef, "messages");

        await addDoc(msgsRef, {
            role,
            text,
            senderId: senderId || 'system',
            createdAt: serverTimestamp()
        });

        // Update last message
        await import("firebase/firestore").then(({ updateDoc }) =>
            updateDoc(docRef, {
                lastSystemMessage: role === 'sistema' ? text : null,
                updatedAt: serverTimestamp()
            })
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error sending note:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Register evidence (photo) for a transaction (Direct Write)
 */
export const submitEvidence = async (transactionId: string, url: string, type: string, description?: string) => {
    try {
        const docRef = doc(db, "transactions", transactionId);
        const evidenceRef = collection(docRef, "evidence");

        await addDoc(evidenceRef, {
            url,
            type,
            description: description || '',
            uploadedBy: 'user', // Simplified
            aiVerified: false,
            createdAt: serverTimestamp()
        });

        await import("firebase/firestore").then(({ updateDoc, increment }) =>
            updateDoc(docRef, {
                evidenceCount: increment(1),
                updatedAt: serverTimestamp()
            })
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error submitting evidence:", error);
        return { success: false, error: error.message };
    }
};
