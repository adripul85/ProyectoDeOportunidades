import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Reemplaza esto con la config de tu proyecto de Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAxlmDDOHY3D27hGVhYZCnwRVupOn9gt3w",
    authDomain: "deoportunidades.firebaseapp.com",
    projectId: "deoportunidades",
    storageBucket: "deoportunidades.firebasestorage.app",
    messagingSenderId: "194924574195",
    appId: "1:194924574195:web:4166c84b1fe8f9487ace86",
    measurementId: "G-7GC2SXDNM5"
};

const app = initializeApp(firebaseConfig);

import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Exportamos las herramientas listas para usar
export const db = getFirestore(app);       // Base de datos
export const auth = getAuth(app);          // Usuarios
export const storage = getStorage(app);    // Para subir fotos
export const functions = getFunctions(app); // Funciones Cloud
export const googleProvider = new GoogleAuthProvider();

// Conectar emuladores si estamos en localhost
// Conectar emuladores si estamos en localhost
// if (typeof window !== "undefined" && typeof location !== "undefined" && location.hostname === "localhost") {
//     connectFunctionsEmulator(functions, "127.0.0.1", 5001);
// }
