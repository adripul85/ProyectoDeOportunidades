import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

console.log('🗑️  Iniciando eliminación de todos los artículos...\n');

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

        console.log(`📊 Encontrados: ${snapshot.size} artículos\n`);

        if (snapshot.size === 0) {
            console.log('✅ No hay artículos para borrar');
            process.exit(0);
        }

        let deleted = 0;

        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, 'items', docSnap.id));
            deleted++;
            console.log(`🗑️  [${deleted}/${snapshot.size}] Eliminado: ${docSnap.data().title || docSnap.id}`);
        }

        console.log(`\n✅ ¡Eliminación completada!`);
        console.log(`📊 Total eliminados: ${deleted} artículos`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

deleteAllItems();
