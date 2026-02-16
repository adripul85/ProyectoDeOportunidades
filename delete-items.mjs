import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

console.log('🗑️  Iniciando eliminación masiva de artículos...\n');

const firebaseConfig = {
    apiKey: "AIzaSyAxlmDDOHY3D27hGVhYZCnwRVupOn9gt3w",
    authDomain: "deoportunidades.firebaseapp.com",
    projectId: "deoportunidades",
    storageBucket: "deoportunidades.firebasestorage.app",
    messagingSenderId: "194924574195",
    appId: "1:194924574195:web:4166c84b1fe8f9487ace86"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllItems() {
    try {
        const itemsRef = collection(db, 'items');
        const snapshot = await getDocs(itemsRef);

        console.log(`📊 Encontrados: ${snapshot.size} artículos`);

        if (snapshot.size === 0) {
            console.log('✅ No hay artículos para borrar');
            process.exit(0);
        }

        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });

        console.log('⏳ Procesando eliminación...');
        await batch.commit();

        console.log(`\n✅ ¡Eliminación completada!`);
        console.log(`📊 Total eliminados: ${snapshot.size} artículos`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteAllItems();
