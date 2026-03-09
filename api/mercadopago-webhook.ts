import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
    initializeApp({
        // En Vercel, usaremos service account desde env var si es necesario, 
        // o las credenciales por defecto si tiene permisos asignados.
        projectId: process.env.VITE_FIREBASE_PROJECT_ID
    });
}

const db = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Mercado Pago envía notificaciones por query params o body dependiendo del tipo
    const { action, data, type } = req.body;

    try {
        // Solo nos interesan los pagos (payment)
        if (type === "payment" || action === "payment.created" || action === "payment.updated") {
            const paymentId = data?.id || req.query.id;

            if (!paymentId) return res.status(400).send('No payment ID');

            // Consultar estado del pago a Mercado Pago
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });

            if (!mpResponse.ok) throw new Error('Error fetching payment from MP');

            const paymentData = await mpResponse.json();

            if (paymentData.status === 'approved') {
                const productId = paymentData.external_reference;

                if (productId) {
                    // Actualizar estado del producto en Firestore usando ADMIN SDK
                    // Esto es necesario porque el webhook no está autenticado como usuario
                    const productRef = db.collection('items').doc(productId);
                    await productRef.update({
                        status: 'PAID_IN_CUSTODY', // El dinero está en Vendelo Ya (Escrow)
                        paymentId: paymentId,
                        updatedAt: new Date()
                    });

                    // También podríamos crear una transacción en una colección 'orders' o 'transactions'
                    await db.collection('transactions').add({
                        productId,
                        paymentId,
                        amount: paymentData.transaction_amount,
                        status: 'PAID',
                        buyerId: paymentData.metadata?.buyer_id || 'unknown',
                        sellerId: paymentData.metadata?.seller_id || 'unknown',
                        createdAt: new Date()
                    });

                    console.log(`✅ Pago aprobado y producto ${productId} actualizado.`);
                }
            }
        }

        return res.status(200).send('OK');
    } catch (error: any) {
        console.error("Webhook Error:", error);
        // Respondemos 200 de todas formas para que MP no reintente infinitamente si es un error de lógica
        return res.status(200).send('Error but handled');
    }
}
