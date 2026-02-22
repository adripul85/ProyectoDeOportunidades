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
    deliveryMethods?: string[]; // ['correo_argentino', 'en_mano', 'acordar', 'domicilio']
    views?: number;
    sellerId: string; // ID del usuario que vende
    brand?: string;
    color?: string;
    location?: string; // Ubicación del vendedor (ej: "Mendoza, AR")
    status?: 'AVAILABLE' | 'SOLD';
    isFeatured?: boolean;
    featuredUntil?: any;
    createdAt?: any;
}

export type ItemCondition = 'new' | 'like_new' | 'good' | 'used' | 'repair' | 'digital' | 'service';

export const CATEGORIES_STRUCTURE = {
    "Electrónica": ["Celulares", "Tablets", "Computadoras", "Audio", "TV y Video", "Cámaras y Accesorios", "Accesorios Electrónicos", "Consolas de Videojuegos", "Drones"],
    "Hogar": ["Muebles", "Electrodomésticos", "Decoración", "Cocina", "Baño", "Dormitorio"],
    "Moda": ["Ropa Mujer", "Ropa Hombre", "Calzado", "Relojes", "Joyas", "Bolsos y Accesorios"],
    "Deportes": ["Fitness", "Ciclismo", "Fútbol", "Camping", "Suplementos"],
    "Vehículos": ["Autos y Camionetas", "Motos", "Accesorios y Repuestos"],
    "Otros": ["Juguetes", "Mascotas", "Libros", "Herramientas", "Servicios"]
};

export const CATEGORIES = Object.values(CATEGORIES_STRUCTURE).flat();

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

// Fetch featured items
export const getFeaturedItems = async () => {
    try {
        const now = new Date();
        const q = query(
            collection(db, "items"),
            where("isFeatured", "==", true),
            where("status", "==", "AVAILABLE")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as (ItemData & { id: string })))
            .filter(item => !item.featuredUntil || item.featuredUntil.toDate() > now);
    } catch (error) {
        console.error("Error fetching featured items:", error);
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

// Toggle featured status for an item
export const toggleFeaturedItem = async (id: string, currentlyFeatured: boolean) => {
    try {
        const docRef = doc(db, "items", id);
        const featuredUntil = !currentlyFeatured ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null;

        await import("firebase/firestore").then(({ updateDoc }) => updateDoc(docRef, {
            isFeatured: !currentlyFeatured,
            featuredUntil: featuredUntil
        }));

        return { success: true, isFeatured: !currentlyFeatured };
    } catch (error) {
        console.error("Error toggling featured status:", error);
        return { success: false, error };
    }
};
