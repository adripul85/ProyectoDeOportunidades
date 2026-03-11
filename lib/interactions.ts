import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    getDocs,
    orderBy
} from "firebase/firestore";
import { db } from "./firebase";

// --- FAVORITES ---

export const toggleFavorite = async (userId: string, productId: string) => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", productId);
        const docSnap = await getDoc(favoriteRef);

        if (docSnap.exists()) {
            await deleteDoc(favoriteRef);
            return { isFavorite: false };
        } else {
            await setDoc(favoriteRef, {
                productId,
                addedAt: serverTimestamp()
            });
            return { isFavorite: true };
        }
    } catch (error) {
        console.error("Error toggling favorite:", error);
        throw error;
    }
};

export const checkIsFavorite = async (userId: string, productId: string) => {
    try {
        const favoriteRef = doc(db, "users", userId, "favorites", productId);
        const docSnap = await getDoc(favoriteRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking favorite:", error);
        return false;
    }
};

// --- ALERTS (Notifications) ---

export const toggleProductAlert = async (userId: string, productId: string) => {
    try {
        const alertRef = doc(db, "users", userId, "alerts", productId);
        const docSnap = await getDoc(alertRef);

        if (docSnap.exists()) {
            await deleteDoc(alertRef);
            return { hasAlert: false };
        } else {
            await setDoc(alertRef, {
                productId,
                type: 'price_drop', // Default alert type
                createdAt: serverTimestamp()
            });
            return { hasAlert: true };
        }
    } catch (error) {
        console.error("Error toggling alert:", error);
        throw error;
    }
};

export const checkHasAlert = async (userId: string, productId: string) => {
    try {
        const alertRef = doc(db, "users", userId, "alerts", productId);
        const docSnap = await getDoc(alertRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking alert:", error);
        return false;
    }
};

// --- REPORTING ---

export interface ReportData {
    reporterId: string;
    reporterName: string; // For quicker display
    targetId: string; // Product ID or User ID
    targetType: 'product' | 'user';
    reason: string;
    description: string;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    createdAt?: any;
}

export const reportItem = async (data: Omit<ReportData, 'status' | 'createdAt'>) => {
    try {
        await addDoc(collection(db, "reports"), {
            ...data,
            status: 'pending',
            createdAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error submitting report:", error);
        return { success: false, error };
    }
};

// --- ADMIN REPORTS ---

export const getReports = async () => {
    try {
        const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (ReportData & { id: string })[];
    } catch (error) {
        console.error("Error fetching reports:", error);
        return [];
    }
};

export const resolveReport = async (reportId: string, status: ReportData['status'], targetId?: string, targetType?: string) => {
    try {
        await import("firebase/firestore").then(({ updateDoc, doc }) =>
            updateDoc(doc(db, "reports", reportId), { status })
        );

        // Logic for TRUE reports (Eliminar contenido)
        if (status === 'resolved' && targetType === 'product' && targetId) {
            const { deleteItem } = await import('./items');
            await deleteItem(targetId);
        }

        // Logic for FALSE reports (Mantener contenido)
        // No action needed for 'dismissed', as the item remains AVAILABLE by default.
        // If we implemented a "hide while pending" feature, we would set it back to AVAILABLE here.

        return { success: true };
    } catch (error) {
        console.error("Error resolving report:", error);
        return { success: false, error };
    }
};
// --- FOLLOW SYSTEM ---

export const sendNotification = async (userId: string, notification: { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; link?: string }) => {
    try {
        await addDoc(collection(db, "users", userId, "notifications"), {
            ...notification,
            read: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

// --- FOLLOW SYSTEM ---

export const toggleFollow = async (followerId: string, followedId: string, followerName: string = 'Alguien') => {
    try {
        const followRef = doc(db, "users", followerId, "following", followedId);
        const docSnap = await getDoc(followRef);

        if (docSnap.exists()) {
            await deleteDoc(followRef);
            return { isFollowing: false };
        } else {
            await setDoc(followRef, {
                followedId,
                followedAt: serverTimestamp()
            });

            // Send notification to the followed user
            await sendNotification(followedId, {
                title: 'Nuevo Seguidor',
                message: `${followerName} ha comenzado a seguirte.`,
                type: 'info',
                link: `/profile/${followerId}`
            });

            return { isFollowing: true };
        }
    } catch (error) {
        console.error("Error toggling follow:", error);
        throw error;
    }
};

export const checkIsFollowing = async (followerId: string, followedId: string) => {
    try {
        const followRef = doc(db, "users", followerId, "following", followedId);
        const docSnap = await getDoc(followRef);
        return docSnap.exists();
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};

// --- INTERACTION TRACKING ---

export const trackProductView = async (productId: string) => {
    try {
        const { increment, updateDoc } = await import("firebase/firestore");
        const productRef = doc(db, "items", productId);
        await updateDoc(productRef, {
            views: increment(1)
        });
    } catch (error) {
        console.error("Error tracking product view:", error);
    }
};
