import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, price, quantity, productId, sellerId } = req.body;
    console.log(`[MP API] Initiating preference for: Product: ${productId}, Seller: ${sellerId}, Price: ${price}`);

    try {
        if (!sellerId) {
            console.error("[MP API] Error: Missing sellerId in Request Payload");
            return res.status(400).json({ error: 'Falta el ID del vendedor' });
        }

        // Buscar las credenciales de Mercado Pago del vendedor
        console.log(`[MP API] Fetching seller doc from Firestore: ${sellerId}`);
        const sellerDoc = await adminDb.collection('users').doc(sellerId).get();
        if (!sellerDoc.exists) {
            console.error(`[MP API] Error: Seller ${sellerId} not found in Firestore`);
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }
        
        const sellerData = sellerDoc.data();
        const sellerOAuth = sellerData?.mercadoPagoOAuth;
        
        if (!sellerOAuth || !sellerOAuth.accessToken) {
            console.error(`[MP API] Error: Seller ${sellerId} has no MP OAuth Access Token linked`);
            return res.status(400).json({ error: 'El vendedor no tiene tu cuenta de Mercado Pago vinculada. No se puede usar Split Payments.' });
        }

        console.log(`[MP API] Seller OK. Calculating Fees. AccessToken prefix: ${sellerOAuth.accessToken.substring(0, 15)}...`);

        // COMISIÓN VENDELO YA! (Ejemplo: 7%)
        const platformFeePercentage = 0.07;
        const totalAmmount = Number(price) * Number(quantity);
        const marketplaceFee = Math.round(totalAmmount * platformFeePercentage);

        const mpPayload = {
            items: [
                {
                    title: title,
                    unit_price: Number(price),
                    quantity: Number(quantity),
                    currency_id: 'ARS'
                }
            ],
            // ... y ACA nos quedamos con nuestra comisión (va a la cuenta atada al APP ID que generó el Access Token OAuth)
            marketplace_fee: marketplaceFee,
            external_reference: productId,
            metadata: {
                seller_id: sellerId,
                product_id: productId,
                platform_fee: marketplaceFee
            },
            notification_url: `https://${req.headers.host}/api/mercadopago-webhook`,
            back_urls: {
                success: `https://${req.headers.host}/payment/success`,
                failure: `https://${req.headers.host}/payment/failure`,
                pending: `https://${req.headers.host}/payment/pending`
            },
            auto_return: 'approved'
        };

        console.log(`[MP API] Sending Payload to Mercado Pago:`, JSON.stringify(mpPayload, null, 2));
        
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                // USAMOS EL TOKEN DEL VENDEDOR para que la plata vaya a él...
                'Authorization': `Bearer ${sellerOAuth.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mpPayload)
        });

        // Parse result carefully
        let data;
        const rawRes = await response.text();
        console.log(`[MP API] Raw MP Response:`, rawRes.substring(0, 300));

        try {
            data = JSON.parse(rawRes);
        } catch(e) {
            console.error(`[MP API] Error parsing MP response. Raw text:`, rawRes);
            throw new Error('Respuesta inválida de Mercado Pago');
        }

        if (!response.ok) {
            console.error(`[MP API] Preference Creation Failed. Status: ${response.status}`, data);
            throw new Error(data.message || 'Error creating preference in Mercado Pago');
        }

        console.log(`[MP API] Preference Created Success. ID: ${data.id}`);
        return res.status(200).json({ id: data.id, init_point: data.init_point });
    } catch (error: any) {
        console.error("[MP API] Fatal Error Catch Block:", error);
        return res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
}
