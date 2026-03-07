import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { db } from "./firebase";

// Definimos qué forma tiene un Producto
export interface ItemData {
    title: string;
    price: number;
    description: string;
    category: string;
    subcategory?: string;
    condition: 'new' | 'like_new' | 'good' | 'used' | 'repair' | 'digital' | 'service';
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
    oldPrice?: number;
    featuredUntil?: any;
    featuredFeeApplied?: number;
    createdAt?: any;
}

export type ItemCondition = 'new' | 'like_new' | 'good' | 'used' | 'repair' | 'digital' | 'service';

import { CATEGORIES as CONST_CATEGORIES } from "./constants";

// Maintaining compatibility: map names from objects if needed
export const CATEGORIES = CONST_CATEGORIES.map(c => c.name);

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

// Fetch featured items with smart algorithm (Facebook Marketplace-style)
// Premisas: 1) Urgencia, 2) Geolocalización, 3) Engagement (CTR), 4) Calidad
export const getFeaturedItems = async (userLocation?: string) => {
    try {
        const now = new Date();
        const q = query(
            collection(db, "items"),
            where("isFeatured", "==", true),
            where("status", "==", "AVAILABLE")
        );
        const querySnapshot = await getDocs(q);
        const allFeatured = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as (ItemData & { id: string })))
            // Filtrar expirados
            .filter(item => !item.featuredUntil || item.featuredUntil.toDate() > now)
            // Filtro de Calidad: al menos 1 imagen
            .filter(item => item.images && item.images.length >= 1);

        // Scoring: combinar urgencia + engagement
        const scored = allFeatured.map(item => {
            const expiresAt = item.featuredUntil?.toDate?.() || new Date(Date.now() + 86400000);
            const msLeft = expiresAt.getTime() - now.getTime();
            // Menor tiempo restante = más urgente = score más alto
            const urgencyScore = Math.max(0, 1 - (msLeft / (48 * 3600 * 1000))); // normalizado 0-1
            // Más vistas = más popular
            const engagementScore = Math.min(1, (item.views || 0) / 100); // normalizado 0-1
            // Ponderación: 60% urgencia, 40% engagement
            const totalScore = (urgencyScore * 0.6) + (engagementScore * 0.4);
            // Match de ubicación
            const isLocal = userLocation && item.location
                ? item.location.toLowerCase().includes(userLocation.toLowerCase())
                : false;

            return { ...item, _score: totalScore, _isLocal: isLocal };
        });

        // Separar locales y nacionales, cada grupo ordenado por score descendente
        const localItems = scored.filter(i => i._isLocal).sort((a, b) => b._score - a._score);
        const nationalItems = scored.filter(i => !i._isLocal).sort((a, b) => b._score - a._score);

        // Locales primero, luego nacionales
        return [...localItems, ...nationalItems];
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

        // Record old price if it changes
        if (data.price !== undefined) {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const currentData = snap.data() as ItemData;
                if (currentData.price !== data.price) {
                    data.oldPrice = currentData.price;
                }
            }
        }

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
        const featuredUntil = !currentlyFeatured ? new Date(Date.now() + 12 * 60 * 60 * 1000) : null;

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

/**
 * Fetch smart suggestions for the user based on behavior
 */
export const getSmartSuggestions = async (uid: string, limitCount: number = 8): Promise<(ItemData & { id: string })[]> => {
    try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return [];

        const userData = userSnap.data();
        const searches = userData.recentSearches || [];
        const viewedCats = userData.viewedCategories || [];
        const viewedProducts = userData.viewedProducts || [];

        // Final interest list (union of searches and viewed categories)
        const interests = [...new Set([...searches, ...viewedCats])].slice(-5);

        if (interests.length === 0) return [];

        // Pick a random interest for variety
        const randomInterest = interests[Math.floor(Math.random() * interests.length)];

        const q = query(
            collection(db, "items"),
            where("category", "==", randomInterest),
            where("status", "==", "AVAILABLE"),
            limit(limitCount + viewedProducts.length) // Fetch more to allow for filtering
        );

        const snapshot = await getDocs(q);
        const items = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as (ItemData & { id: string })))
            .filter(item => !viewedProducts.includes(item.id))
            .slice(0, limitCount);

        return items;
    } catch (error) {
        console.error("Error fetching smart suggestions:", error);
        return [];
    }
};
