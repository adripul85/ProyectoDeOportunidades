import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { updateUserProfile } from "./users";

export interface ReviewData {
    transactionId: string;
    itemId: string;
    sellerId: string;
    buyerId: string;
    buyerName: string;
    buyerAvatar: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: any;
}

// Create a new review
export const createReview = async (data: Omit<ReviewData, 'createdAt'>) => {
    try {
        // Check if review already exists for this transaction
        const existing = await getReviewForTransaction(data.transactionId);
        if (existing) {
            return { success: false, error: 'Ya has calificado esta transacción' };
        }

        // Validate rating
        if (data.rating < 1 || data.rating > 5) {
            return { success: false, error: 'La calificación debe ser entre 1 y 5 estrellas' };
        }

        // Create review
        const docRef = await addDoc(collection(db, "reviews"), {
            ...data,
            createdAt: serverTimestamp(),
        });

        // Update seller's reputation
        await updateSellerReputation(data.sellerId);

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating review:", error);
        return { success: false, error };
    }
};

// Get all reviews for a seller
export const getReviewsForSeller = async (sellerId: string): Promise<(ReviewData & { id: string })[]> => {
    try {
        const q = query(
            collection(db, "reviews"),
            where("sellerId", "==", sellerId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (ReviewData & { id: string })[];
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

// Check if transaction has been reviewed
export const getReviewForTransaction = async (transactionId: string): Promise<(ReviewData & { id: string }) | null> => {
    try {
        const q = query(
            collection(db, "reviews"),
            where("transactionId", "==", transactionId)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return null;

        const doc = querySnapshot.docs[0];
        return {
            id: doc.id,
            ...doc.data()
        } as (ReviewData & { id: string });
    } catch (error) {
        console.error("Error checking review:", error);
        return null;
    }
};

// Update seller's reputation (recalculate average)
export const updateSellerReputation = async (sellerId: string) => {
    try {
        const reviews = await getReviewsForSeller(sellerId);

        if (reviews.length === 0) {
            await updateUserProfile(sellerId, {
                reputation: {
                    averageRating: 0,
                    totalReviews: 0,
                    lastUpdated: serverTimestamp()
                }
            } as any);
            return { success: true };
        }

        // Calculate average
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        // Update user profile
        await updateUserProfile(sellerId, {
            reputation: {
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                totalReviews: reviews.length,
                lastUpdated: serverTimestamp()
            }
        } as any);

        return { success: true };
    } catch (error) {
        console.error("Error updating reputation:", error);
        return { success: false, error };
    }
};
