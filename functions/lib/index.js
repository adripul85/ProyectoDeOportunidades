"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoReleaseEscrow = exports.submitEvidence = exports.addEscrowNote = exports.refundFunds = exports.releaseFunds = exports.updateTracking = exports.updateTransactionStatus = exports.createPayment = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mercadopago_1 = require("mercadopago");
admin.initializeApp();
const db = admin.firestore();
// 1. CONFIGURACIÓN MERCADO PAGO
const client = new mercadopago_1.MercadoPagoConfig({ accessToken: 'TEST-3723388313099209-010813-b29e24f815b6c621e0eb14af1a87935f-148630764' });
/**
 * 2. HELPERS
 */
async function getSystemAdminId() {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('role', '==', 'admin').orderBy('createdAt', 'asc').limit(1).get();
    if (!snapshot.empty)
        return snapshot.docs[0].id;
    return null;
}
async function distributeEscrowFunds(transactionId, data) {
    const adminId = await getSystemAdminId();
    const sellerRef = db.collection('users').doc(data.sellerId);
    // Calculated based on new model (Step Id 5789 logic)
    const sellerProceeds = data.amountProduct || data.amount;
    const platformRevenue = data.amountPlatformFee || data.amountPlatformFee || 0;
    const batch = db.batch();
    // A. Pay Seller
    batch.update(sellerRef, {
        "wallet.available": admin.firestore.FieldValue.increment(sellerProceeds),
        "wallet.lastUpdated": admin.firestore.FieldValue.serverTimestamp()
    });
    // B. Pay Admin
    if (adminId && platformRevenue > 0) {
        const adminRef = db.collection('users').doc(adminId);
        batch.update(adminRef, {
            "wallet.available": admin.firestore.FieldValue.increment(platformRevenue),
            "wallet.lastUpdated": admin.firestore.FieldValue.serverTimestamp()
        });
        // C. Log Revenue
        const logRef = db.collection('financial_logs').doc();
        batch.set(logRef, {
            transactionId,
            type: 'platform_fee',
            amount: platformRevenue,
            currency: 'ARS',
            relatedUser: data.sellerId,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    await batch.commit();
}
/**
 * 3. CREAR PREFERENCIA DE PAGO
 */
exports.createPayment = functions.https.onCall(async (request) => {
    const data = request.data;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado.');
    try {
        const preference = new mercadopago_1.Preference(client);
        const result = await preference.create({
            body: {
                items: [{ id: data.transactionId, title: data.title, quantity: 1, unit_price: Number(data.price), currency_id: 'ARS' }],
                back_urls: {
                    success: "https://deoportunidades.web.app/#/payment/success",
                    failure: "https://deoportunidades.web.app/#/payment/failure",
                    pending: "https://deoportunidades.web.app/#/payment/pending",
                },
                auto_return: "approved",
                external_reference: data.transactionId,
            }
        });
        return { url: result.init_point || result.sandbox_init_point };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
/**
 * 3. ACTUALIZAR ESTADO DE TRANSACCIÓN (SECURE FSM)
 */
exports.updateTransactionStatus = functions.https.onCall(async (request) => {
    const { transactionId, status } = request.data;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado.');
    const txRef = db.collection('transactions').doc(transactionId);
    const doc = await txRef.get();
    if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'Transacción no encontrada.');
    const data = doc.data();
    // VALIDAR PERMISOS
    const isBuyer = data.buyerId === request.auth.uid;
    const isSeller = data.sellerId === request.auth.uid;
    const isAdmin = data.isAdmin === true; // Simplified admin check
    // LÓGICA DE TRANSICIÓN DE ESTADOS
    if (status === 'DISPUTED' && (isBuyer || isSeller || isAdmin)) {
        await txRef.update({ status: 'DISPUTED', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { success: true };
    }
    if (status === 'CANCELLED' && isBuyer && data.status === 'PENDING_PAYMENT') {
        await txRef.update({ status: 'CANCELLED', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
        return { success: true };
    }
    throw new functions.https.HttpsError('permission-denied', 'No tienes permiso para realizar esta acción o la transición no es válida.');
});
/**
 * 4. REGISTRAR TRACKING Y MARCAR COMO ENVIADO
 */
exports.updateTracking = functions.https.onCall(async (request) => {
    const { transactionId, trackingId, courier } = request.data;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado.');
    const txRef = db.collection('transactions').doc(transactionId);
    const doc = await txRef.get();
    if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'Transacción no encontrada.');
    const data = doc.data();
    if (data.sellerId !== request.auth.uid) {
        throw new functions.https.HttpsError('permission-denied', 'Solo el vendedor puede registrar el envío.');
    }
    if (data.status !== 'PAID_HELD') {
        throw new functions.https.HttpsError('failed-precondition', 'La transacción debe estar pagada para registrar envío.');
    }
    await txRef.update({
        status: 'SHIPPED',
        trackingId,
        courier,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
});
/**
 * 5. LIBERAR FONDOS (ESCROW RELEASE)
 */
exports.releaseFunds = functions.https.onCall(async (request) => {
    const { transactionId, qrToken } = request.data;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado.');
    const txRef = db.collection('transactions').doc(transactionId);
    const doc = await txRef.get();
    if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'Transacción no encontrada.');
    const data = doc.data();
    const isBuyer = data.buyerId === request.auth.uid;
    const isAdmin = false; // TODO: Implement real admin check via custom claims
    // Validar token si es intercambio en persona
    if (data.deliveryMethod === 'MEETING' && data.qrCode !== qrToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Token de seguridad inválido.');
    }
    if (!isBuyer && !isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Solo el comprador puede liberar los fondos.');
    }
    if (data.status === 'COMPLETED') {
        throw new functions.https.HttpsError('failed-precondition', 'Los fondos ya fueron liberados.');
    }
    // EJECUTAR LIBERACIÓN
    await txRef.update({
        status: 'COMPLETED',
        escrowReleased: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // DISTRIBUTE FUNDS (New model balanced logic)
    await distributeEscrowFunds(transactionId, data);
    return { success: true };
});
/**
 * 6. REEMBOLSAR FONDOS (REFUND - ADMIN ONLY OR COMPREHENSIVE RULES)
 */
exports.refundFunds = functions.https.onCall(async (request) => {
    const { transactionId } = request.data;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado.');
    const txRef = db.collection('transactions').doc(transactionId);
    const doc = await txRef.get();
    if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'Transacción no encontrada.');
    const data = doc.data();
    const isAdmin = false; // TODO: Real admin check
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Solo un administrador puede ejecutar un reembolso forzado.');
    }
    if (data.status === 'REFUNDED') {
        throw new functions.https.HttpsError('failed-precondition', 'Los fondos ya fueron reembolsados.');
    }
    // EJECUTAR REEMBOLSO
    await txRef.update({
        status: 'REFUNDED',
        escrowReleased: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // Mover saldo de vuelta al comprador
    const buyerRef = db.collection('users').doc(data.buyerId);
    await buyerRef.update({
        "wallet.available": admin.firestore.FieldValue.increment(data.amountTotal || data.total || data.amount),
        "wallet.lastUpdated": admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
});
/**
 * 7. AGREGAR NOTA AL ESCROW (SISTEMA O CHAT)
 */
exports.addEscrowNote = functions.https.onCall(async (request) => {
    const { transactionId, role, text, senderId } = request.data;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado.');
    const txRef = db.collection('transactions').doc(transactionId);
    const doc = await txRef.get();
    if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'Transacción no encontrada.');
    const msgRef = txRef.collection('messages').doc();
    await msgRef.set({
        role,
        text,
        senderId: senderId || request.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await txRef.update({
        lastSystemMessage: role === 'sistema' ? text : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
});
/**
 * 8. REGISTRAR EVIDENCIA (FOTOS/COMPROBANTES)
 */
exports.submitEvidence = functions.https.onCall(async (request) => {
    var _a;
    const { transactionId, url, type, description } = request.data;
    if (!request.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Acceso denegado.');
    const txRef = db.collection('transactions').doc(transactionId);
    const doc = await txRef.get();
    if (!doc.exists)
        throw new functions.https.HttpsError('not-found', 'Transacción no encontrada.');
    const evidenceRef = txRef.collection('evidence').doc();
    await evidenceRef.set({
        url,
        type,
        description: description || '',
        uploadedBy: request.auth.uid,
        aiVerified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const currentCount = ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.evidenceCount) || 0;
    await txRef.update({
        evidenceCount: currentCount + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
});
/**
 * 9. AUTO-RELEASE ESCROW (Scheduled 48h timer)
 * Runs every hour to check for SHIPPED transactions older than 48 hours.
 */
exports.autoReleaseEscrow = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    // Query transactions that are SHIPPED and haven't been updated in 48h
    const snapshot = await db.collection('transactions')
        .where('status', '==', 'SHIPPED')
        .where('updatedAt', '<=', fortyEightHoursAgo)
        .get();
    if (snapshot.empty) {
        console.log('No transactions to auto-release.');
        return null;
    }
    console.log(`Auto-releasing ${snapshot.size} transactions...`);
    const results = [];
    for (const doc of snapshot.docs) {
        const txId = doc.id;
        const data = doc.data();
        try {
            // 1. Update status to COMPLETED
            await doc.ref.update({
                status: 'COMPLETED',
                escrowReleased: true,
                autoReleased: true, // Tracking flag
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // 2. Distribute funds
            await distributeEscrowFunds(txId, data);
            // 3. Optional: Send notification to buyer and seller
            // (System notes are added via addEscrowNote if needed, but here we just log)
            results.push({ id: txId, status: 'success' });
        }
        catch (error) {
            console.error(`Error auto-releasing transaction ${txId}:`, error);
            results.push({ id: txId, status: 'error', message: error.message });
        }
    }
    return results;
});
//# sourceMappingURL=index.js.map