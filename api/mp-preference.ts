import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, price, quantity, productId, sellerId } = req.body;

    try {
        // En un entorno real, usaríamos la SDK de Mercado Pago de Node
        // Pero para este ejemplo con Vercel Functions simples, usamos fetch a la API de MP
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
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
                external_reference: productId,
                metadata: {
                    seller_id: sellerId,
                    product_id: productId
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
