import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "./firebase";

// Definimos qué forma tiene un Producto
export interface ItemData {
    title: string;
    price: number;
    description: string;
    category: string;
    condition: 'new' | 'like_new' | 'good' | 'fair';
    images: string[];
    shippingAvailable?: boolean;
    sellerId: string; // ID del usuario que vende
    brand?: string;
    color?: string;
}

export const CATEGORIES = [
    "Computación",
    "Celulares y Teléfonos",
    "Audio y Video",
    "Videojuegos",
    "Muebles y Decoración",
    "Electrodomésticos",
    "Moda y Accesorios",
    "Joyas y Relojes",
    "Belleza y Salud",
    "Deportes y Fitness",
    "Accesorios Vehículos",
    "Construcción",
    "Vehículos",
    "Bebés",
    "Oficina y Papelería",
    "Alimentos y Bebidas",
    "Juegos y Juguetes",
    "Mascotas",
    "Instrumentos Musicales",
    "Cámaras y Accesorios",
    "Inmuebles",
    "Servicios",
    "Otras categorías"
];

export const publishItem = async (data: ItemData) => {
    try {
        // Referencia a la colección "items" en la base de datos
        const docRef = await addDoc(collection(db, "items"), {
            ...data,
            status: 'AVAILABLE', // Por defecto está disponible
            createdAt: serverTimestamp(), // Guardamos la hora exacta del servidor
            searchKeywords: generateKeywords(data.title) // Truco para búsquedas simples
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error al publicar:", error);
        return { success: false, error };
    }
};

// Pequeña ayuda para poder buscar "iphone" y encontrar "iPhone 13"
const generateKeywords = (title: string) => {
    return title.toLowerCase().split(' ');
};

// Fetch all available items
export const getItems = async () => {
    try {
        const q = query(
            collection(db, "items"),
            where("status", "==", "AVAILABLE"),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (ItemData & { id: string })[];
    } catch (error) {
        console.error("Error al obtener items:", error);
        return [];
    }
};

// Fetch items by seller ID
export const getItemsBySeller = async (sellerId: string) => {
    try {
        const q = query(
            collection(db, "items"),
            where("sellerId", "==", sellerId),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (ItemData & { id: string })[];
    } catch (error) {
        console.error("Error fetching items by seller:", error);
        return [];
    }
};

// Fetch single item by ID
export const getProduct = async (id: string) => {
    try {
        const docRef = doc(db, "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as (ItemData & { id: string });
        }
        return null;
    } catch (error) {
        console.error("Error al obtener producto:", error);
        return null;
    }
};

// Update an existing item
export const updateItem = async (id: string, data: Partial<ItemData>) => {
    try {
        const docRef = doc(db, "items", id);
        await import("firebase/firestore").then(({ updateDoc }) => updateDoc(docRef, { ...data }));
        return { success: true };
    } catch (error) {
        console.error("Error updating item:", error);
        return { success: false, error };
    }
};

// Delete an item (or mark as deleted)
export const deleteItem = async (id: string) => {
    try {
        const docRef = doc(db, "items", id);
        await import("firebase/firestore").then(({ deleteDoc }) => deleteDoc(docRef));
        return { success: true };
    } catch (error) {
        console.error("Error deleting item:", error);
        return { success: false, error };
    }
};

// Subscribe to a product for real-time updates (deletion/changes)
export const subscribeToProduct = (id: string, callback: (item: (ItemData & { id: string }) | null) => void) => {
    const docRef = doc(db, "items", id);
    return import("firebase/firestore").then(({ onSnapshot }) => {
        return onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() } as (ItemData & { id: string }));
            } else {
                callback(null);
            }
        });
    });
};
