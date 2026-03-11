import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Reemplaza esto con la config de tu proyecto de Firebase Console
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if API Key exists to avoid cryptic Firebase errors
if (!firebaseConfig.apiKey) {
    console.error("❌ ERROR DE CONFIGURACIÓN: No se encontró VITE_FIREBASE_API_KEY. Revisa tu archivo .env o las variables de entorno en Vercel.");
}

const app = initializeApp(firebaseConfig);

import { initializeFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Exportamos las herramientas listas para usar
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Use experimental prefix if standard fails
} as any);
export const auth = getAuth(app);          // Usuarios
export const storage = getStorage(app);    // Para subir fotos
export const functions = getFunctions(app); // Funciones Cloud
export const googleProvider = new GoogleAuthProvider();

// Conectar emuladores si estamos en localhost
// Conectar emuladores si estamos en localhost
// if (typeof window !== "undefined" && typeof location !== "undefined" && location.hostname === "localhost") {
//     connectFunctionsEmulator(functions, "127.0.0.1", 5001);
// }
