import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // Mercado Pago envía notificaciones por query params o body dependiendo del tipo
    const { action, data, type } = req.body;

    // A veces MercadoPago envía un ping de confirmación
    if (action === "test.created") {
        return res.status(200).send('OK');
    }

    try {
        // Solo nos interesan los pagos (payment)
        if (type === "payment" || action === "payment.created" || action === "payment.updated") {
            const paymentId = data?.id || req.query.data?.id || req.body?.data?.id;

            if (!paymentId) {
                 // Si MP envía un POST simple sin ID claro, logueamos
                 console.log("No payment ID in body:", req.body);
                 return res.status(400).send('No payment ID');
            }

            // ATENCIÓN: Con Split Payments, el pago se hizo a nombre del vendedor.
            // Necesitamos consultar con Credenciales (Access Token) que tenga acceso a ese cobro,
            // pero normalmente el webhook lo configuraste en TÚ aplicación (APP OWNER), 
            // así que el Bearer Token del App Owner DEBERÍA tener acceso a ver la transacción de su Marketplace.
            
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
            });

            if (!mpResponse.ok) {
                const errData = await mpResponse.json();
                console.error("Error fetching MP payment (Is API Key Valid?):", errData);
                throw new Error('Error fetching payment from MP');
            }

            const paymentData = await mpResponse.json();

            if (paymentData.status === 'approved') {
                const productId = paymentData.metadata?.product_id;
                const buyerId = paymentData.metadata?.buyer_id || 'unknown';
                const sellerId = paymentData.metadata?.seller_id || 'unknown';
                const platformFee = paymentData.metadata?.platform_fee || 0;

                if (productId) {
                    // Actualizar estado del producto en Firestore usando ADMIN SDK
                    // El dinero AHORA está en la cuenta MP del vendedor (Split Payment)
                    const productRef = adminDb.collection('items').doc(productId);
                    await productRef.update({
                        status: 'PAID_IN_CUSTODY', 
                        paymentId: paymentId,
                        updatedAt: new Date()
                    });

                    // Registrar Transacción y Escrow
                    await adminDb.collection('transactions').add({
                        productId,
                        paymentId,
                        amount: paymentData.transaction_amount,
                        platformFee: platformFee, // Lo que ganó la plataforma
                        status: 'IN_ESCROW', // El vendedor tiene la plata, pero debe entregar
                        buyerId: buyerId,
                        sellerId: sellerId,
                        createdAt: new Date(),
                        paymentPlatform: 'MercadoPago_Split'
                    });

                    console.log(`✅ Pago Split aprobado y producto ${productId} en Escrow simulado.`);
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
