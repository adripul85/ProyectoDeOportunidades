import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../lib/firebase-admin';
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, price, quantity, productId, sellerId } = req.body;

    try {
        // Buscar las credenciales de Mercado Pago del vendedor
        const sellerDoc = await adminDb.collection('users').doc(sellerId).get();
        if (!sellerDoc.exists) {
            return res.status(404).json({ error: 'Vendedor no encontrado' });
        }
        
        const sellerData = sellerDoc.data();
        const sellerOAuth = sellerData?.mercadoPagoOAuth;
        
        if (!sellerOAuth || !sellerOAuth.accessToken) {
            return res.status(400).json({ error: 'El vendedor no tiene tu cuenta de Mercado Pago vinculada. No se puede usar Split Payments.' });
        }

        // COMISIÓN VENDELO YA! (Ejemplo: 7%)
        const platformFeePercentage = 0.07;
        const totalAmmount = Number(price) * Number(quantity);
        const marketplaceFee = Math.round(totalAmmount * platformFeePercentage);

        // API MP (Crear preferencia a nombre del APP OWNER / Cuenta Recaudadora pero los fondos van al vendedor menos el FEE)
        // Ojo, en Split Payments, hay 2 modalidades:
        // Modalidad 1: Se crea con el Access Token del Marketplace y se pasa el seller_id en el collector_id (no soportado en items, requiere configuración compleja de MP SDK)
        // Modalidad 2 (Marketplace Clásico): Se crea con el ACCESS_TOKEN del vendedor, y se pasa tu APP_FEE en `marketplace_fee` a favor de tu APP_ID.
        // Iremos con Modalidad 2: El vendedor crea la preferencia (él es el dueño del dinero), pero nosotros (Platform) nos quedamos el fee automáticamente.
        
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                // USAMOS EL TOKEN DEL VENDEDOR para que la plata vaya a él...
                'Authorization': `Bearer ${sellerOAuth.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Error creating preference');
        }

        return res.status(200).json({ id: data.id });
    } catch (error: any) {
        console.error("MP Preference Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
