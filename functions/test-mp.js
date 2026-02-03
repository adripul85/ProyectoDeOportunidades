const { MercadoPagoConfig, Preference } = require('mercadopago');

// Tu Token de Test Real
const client = new MercadoPagoConfig({ accessToken: 'TEST-3723388313099209-010813-b29e24f815b6c621e0eb14af1a87935f-148630764' });

async function testPayment() {
    console.log("🚀 Testing Mercado Pago Connection directly...");

    try {
        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'test-123456',
                        title: 'Test Product',
                        quantity: 1,
                        unit_price: 1500, // Fixed Integer Number
                        currency_id: 'ARS',
                    },
                ],
                back_urls: {
                    success: "https://www.google.com/success",
                    failure: "https://www.google.com/failure",
                    pending: "https://www.google.com/pending",
                },
                auto_return: "approved",
                external_reference: 'test-transaction-id',
            }
        });

        console.log("✅ SUCCESS! Preference ID:", result.id);
        console.log("🔗 Init Point:", result.init_point || result.sandbox_init_point);
    } catch (error) {
        console.error("❌ FAILED!");
        if (error.cause) {
            console.error("Cause:", JSON.stringify(error.cause, null, 2));
        } else {
            console.error("Error:", error);
        }
    }
}

testPayment();
