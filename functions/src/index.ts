import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { MercadoPagoConfig, Preference } from 'mercadopago';

admin.initializeApp();

// 1. CONFIGURACIÓN
// Access Token de TEST proporcionado por el usuario
const client = new MercadoPagoConfig({ accessToken: 'TEST-3723388313099209-010813-b29e24f815b6c621e0eb14af1a87935f-148630764' });

// 2. LA FUNCIÓN QUE LLAMARÁ TU APP
export const createPayment = functions.https.onCall(async (request) => {
    const data = request.data;

    // Seguridad: Validar autenticación
    if (!request.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Debes iniciar sesión para pagar.');
    }

    console.log("💰 [CREATE_PAYMENT] Processing...", data);

    try {
        const preference = new Preference(client);
        const price = Number(data.price);

        if (isNaN(price)) {
            throw new Error(`Invalid Price: ${data.price}`);
        }

        const result = await preference.create({
            body: {
                items: [
                    {
                        id: data.transactionId,
                        title: data.title,
                        quantity: 1,
                        unit_price: price,
                        currency_id: 'ARS',
                    },
                ],
                // URLs de retorno (HTTPS requerido por MP, usando placeholders de producción)
                back_urls: {
                    success: "https://deoportunidades.web.app/success",
                    failure: "https://deoportunidades.web.app/failure",
                    pending: "https://deoportunidades.web.app/pending",
                },
                auto_return: "approved",
                external_reference: data.transactionId,
                statement_descriptor: "DEOPORTUNIDADES",
            }
        });

        console.log("✅ Success URL:", result.init_point || result.sandbox_init_point);
        return { url: result.init_point || result.sandbox_init_point };

    } catch (error: any) {
        console.error("❌ [ERROR BACKEND]:", error);
        throw new functions.https.HttpsError('internal', 'MP Error', {
            message: error.message,
            cause: error.cause
        });
    }
});
