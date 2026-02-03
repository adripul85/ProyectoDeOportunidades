import { doc, updateDoc } from "firebase/firestore";
import { db } from "./lib/firebase.js";

// INSTRUCCIONES:
// 1. Asegúrate de tener tu UID de usuario (puedes verlo en tu perfil o dashboard)
// 2. Reemplaza 'TU_USER_UID_AQUI' con tu UID real.
// 3. Ejecuta este script con: node set-admin.mjs

const USER_UID = 'y6XOp8eFDeb68cMP7caf4tHOB513'; // <--- CAMBIA ESTO

async function makeAdmin() {
    if (USER_UID === 'y6XOp8eFDeb68cMP7caf4tHOB513') {
        console.error("❌ ERROR: Debes poner tu UID real en la variable USER_UID.");
        return;
    }

    try {
        const userRef = doc(db, "users", USER_UID);
        await updateDoc(userRef, {
            role: 'admin'
        });
        console.log(`✅ ÉXITO: El usuario ${USER_UID} ahora es ADMINISTRADOR.`);
        console.log("Recarga la aplicación para ver los cambios.");
    } catch (error) {
        console.error("❌ ERROR al actualizar el rol:", error);
        console.log("\nTIP: Si recibes un error de permisos, asegúrate de que las reglas de Firestore permitan la escritura temporalmente.");
    }
}

makeAdmin();
