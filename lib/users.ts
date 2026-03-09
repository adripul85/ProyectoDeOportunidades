import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebase";
import { deleteUser } from "firebase/auth";


// User Profile Interface
export interface UserProfile {
    uid: string;
    displayName: string;
    dni: string;
    email: string;
    phone: string;
    location: {
        city: string;
        state: string;
    };
    bio?: string;
    avatar: string;
    coverImage?: string;
    profileComplete: boolean;
    certifications?: string[];
    verificationBadges?: {
        identityVerified: boolean;
        addressVerified: boolean;
        phoneVerified: boolean;
    };
    role?: 'admin' | 'moderator' | 'user';
    verificationEvidence?: {
        dniFront: string;
        dniBack: string;
        selfie: string;
        addressProof?: string;
        submittedAt: any;
        status: 'pending' | 'approved' | 'rejected' | 'none';
    };
    wallet?: {
        available: number;
        inEscrow: number;
        pending: number;
        currency: string;
        lastUpdated: any;
    };
    bankDetails?: {
        cbu: string;
        alias: string;
        bankName: string;
        holderName: string;
        accountType: string;
        dni?: string;
    };
    reputation?: {
        averageRating: number;
        totalReviews: number;
        ratingDistribution?: { [key: number]: number };
        lastUpdated: any;
    };
    followersCount?: number;
    followingCount?: number;
    responseTime?: string;

    social?: {
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        twitter?: string;
    };
    logistics?: {
        shippingInfo?: string;
        deliveryMethods?: string[];
        businessHours?: string;
        meetingPoints?: string[];
    };
    identity?: {
        birthday?: string;
        gender?: string;
    };
    notificationPreferences?: {
        emailAlerts: boolean;
        pushAlerts: boolean;
        marketingAlerts: boolean;
    };

    createdAt: any;
    updatedAt?: any;
}

// Create a new user profile
export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, {
            ...data,
            uid,
            profileComplete: false,
            role: 'user',
            wallet: {
                available: 0,
                inEscrow: 0,
                pending: 0,
                currency: 'ARS',
                lastUpdated: serverTimestamp()
            },
            verificationEvidence: {
                status: 'none',
                dniFront: '',
                dniBack: '',
                selfie: '',
                submittedAt: null
            },
            reputation: {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                lastUpdated: serverTimestamp()
            },
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating user profile:", error);
        return { success: false, error };
    }
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
};

// Update user profile
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { success: false, error };
    }
};

// Complete user profile (mark as complete)
export const completeUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...data,
            profileComplete: true,
            updatedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error completing user profile:", error);
        return { success: false, error };
    }
};

// Check if profile is complete
export const checkProfileComplete = async (uid: string): Promise<boolean> => {
    try {
        const profile = await getUserProfile(uid);
        return profile?.profileComplete || false;
    } catch (error) {
        console.error("Error checking profile completion:", error);
        return false;
    }
};

// Delete user account completely
export const deleteUserAccount = async (uid: string) => {
    try {
        // 1. Delete user document from Firestore
        const userRef = doc(db, "users", uid);
        await deleteDoc(userRef);

        // 2. Delete the Firebase Auth user
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
            await deleteUser(currentUser);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting user account:", error);

        // Handle re-authentication requirement
        if (error.code === 'auth/requires-recent-login') {
            return {
                success: false,
                error,
                requiresReauth: true,
                message: "Por seguridad, debes volver a iniciar sesión antes de eliminar tu cuenta."
            };
        }

        return { success: false, error };
    }
};


// --- REVIEWS & FOLLOWERS SYSTEM ---

export interface Review {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    targetId: string;
    rating: number; // 1-5
    comment: string;
    createdAt: any;
    transactionId?: string;
}

export const addUserReview = async (targetUid: string, reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    try {
        const userRef = doc(db, "users", targetUid);
        const reviewsRef = collection(userRef, "reviews");

        // 1. Add Review Doc
        await addDoc(reviewsRef, {
            ...reviewData,
            createdAt: serverTimestamp()
        });

        // 2. Update Average Rating and Distribution (Aggregation)
        const snapshot = await getDocs(reviewsRef);
        let totalStars = 0;
        let count = 0;
        const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        snapshot.forEach(doc => {
            const data = doc.data();
            const r = Math.round(data.rating);
            totalStars += data.rating;
            count++;
            if (distribution[r] !== undefined) {
                distribution[r]++;
            }
        });
        const average = count > 0 ? totalStars / count : 0;

        await updateDoc(userRef, {
            "reputation.averageRating": average,
            "reputation.totalReviews": count,
            "reputation.ratingDistribution": distribution,
            "reputation.lastUpdated": serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error("Error adding review:", error);
        return { success: false, error };
    }
};

export const getUserReviews = async (targetUid: string) => {
    try {
        const reviewsRef = collection(db, "users", targetUid, "reviews");
        const q = query(reviewsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
};

// --- FOLLOW SYSTEM ---

export const followUser = async (followerUid: string, targetUid: string) => {
    try {
        // Add target to follower's "following" collection
        const followingRef = doc(db, "users", followerUid, "following", targetUid);
        await setDoc(followingRef, {
            uid: targetUid,
            followedAt: serverTimestamp()
        });

        // Add follower to target's "followers" collection (optional, for count)
        const followersRef = doc(db, "users", targetUid, "followers", followerUid);
        await setDoc(followersRef, {
            uid: followerUid,
            followedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error("Error following user:", error);
        return { success: false, error };
    }
};

export const unfollowUser = async (followerUid: string, targetUid: string) => {
    try {
        await deleteDoc(doc(db, "users", followerUid, "following", targetUid));
        await deleteDoc(doc(db, "users", targetUid, "followers", followerUid));
        return { success: true };
    } catch (error) {
        console.error("Error unfollowing user:", error);
        return { success: false, error };
    }
};

export const isFollowingUser = async (followerUid: string, targetUid: string) => {
    try {
        const docRef = doc(db, "users", followerUid, "following", targetUid);
        const snapshot = await getDoc(docRef);
        return snapshot.exists();
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
};
export interface Withdrawal {
    id: string;
    uid: string;
    amount: number;
    bankDetails: UserProfile['bankDetails'];
    status: 'pending' | 'completed' | 'rejected';
    createdAt: any;
    updatedAt: any;
}

/**
 * Handle fund withdrawal request
 */
export const withdrawFunds = async (uid: string, amount: number, bankDetails: UserProfile['bankDetails']) => {
    try {
        const { increment, writeBatch } = await import("firebase/firestore");
        const batch = writeBatch(db);

        // 1. Deduct from available balance
        const userRef = doc(db, "users", uid);
        batch.update(userRef, {
            "wallet.available": increment(-amount),
            "wallet.lastUpdated": serverTimestamp()
        });

        // 2. Create withdrawal record
        const withdrawalRef = doc(collection(db, "withdrawals"));
        batch.set(withdrawalRef, {
            uid,
            amount,
            bankDetails,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        await batch.commit();
        return { success: true, id: withdrawalRef.id };
    } catch (error: any) {
        console.error("Error withdrawing funds:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Fetch top sellers based on reputation
 */
export const getTopSellers = async (limitCount: number = 5): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, "users");
        // We filter for users who have at least 1 review and a high rating
        const q = query(
            usersRef,
            where("reputation.totalReviews", ">", 0),
            orderBy("reputation.totalReviews", "desc"),
            orderBy("reputation.averageRating", "desc")
        );

        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => doc.data() as UserProfile);

        // Sort by averageRating descending and then totalReviews
        // (Firestore multiple orderBy on different fields requires index, 
        // using simple logic here or client sort for small numbers)
        return users
            .sort((a, b) => (b.reputation?.averageRating || 0) - (a.reputation?.averageRating || 0))
            .slice(0, limitCount);
    } catch (error) {
        console.error("Error fetching top sellers:", error);
        return [];
    }
};

// --- WALLET MOVEMENTS SYSTEM ---

export interface WalletMovement {
    id?: string;
    uid: string;
    type: 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'FEE_PROTECTION' | 'SALE_REVENUE' | 'BUY_DEDUCTION' | 'WITHDRAWAL_REQUEST' | 'WITHDRAWAL_COMPLETED' | 'PENALTY' | 'PLATFORM_REVENUE';
    amount: number;
    referenceId: string; // Transaction ID or Withdrawal ID
    itemTitle?: string;
    description: string;
    timestamp: any;
}

/**
 * Log a movement in the user's wallet history
 */
export const logWalletMovement = async (movement: Omit<WalletMovement, 'id' | 'timestamp'>) => {
    try {
        const movementsRef = collection(db, "wallet_movements");
        await addDoc(movementsRef, {
            ...movement,
            timestamp: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error logging wallet movement:", error);
        return { success: false, error };
    }
};

/**
 * Fetch wallet movements for a user (Snapshot)
 */
export const getUserWalletMovements = async (uid: string): Promise<WalletMovement[]> => {
    try {
        const movementsRef = collection(db, "wallet_movements");
        const q = query(movementsRef, where("uid", "==", uid), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletMovement));
    } catch (error) {
        console.error("Error fetching wallet movements:", error);
        return [];
    }
};

/**
 * Subscribe to wallet movements for a user
 */
export const subscribeToUserWalletMovements = (uid: string, callback: (movements: WalletMovement[]) => void) => {
    const movementsRef = collection(db, "wallet_movements");
    const q = query(movementsRef, where("uid", "==", uid), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        const movements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WalletMovement));
        callback(movements);
    });
};

// --- BEHAVIOR TRACKING SYSTEM ---

/**
 * Track user searches to improve suggestions
 */
export const trackUserSearch = async (userId: string, searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) return;

    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            const recentSearches = userData.recentSearches || [];

            // Limit to last 10 unique searches
            const term = searchTerm.toLowerCase().trim();
            const updatedSearches = [term, ...recentSearches.filter((s: string) => s !== term)].slice(0, 10);

            await updateDoc(userRef, {
                recentSearches: updatedSearches,
                lastInteraction: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error tracking search:", error);
    }
};

/**
 * Track product views to improve suggestions
 */
export const trackProductView = async (userId: string, productId: string, category: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();

            // Track categories (limit 10)
            const viewedCategories = userData.viewedCategories || [];
            const updatedCategories = [category, ...viewedCategories.filter((c: string) => c !== category)].slice(0, 10);

            // Track products (limit 20)
            const viewedProducts = userData.viewedProducts || [];
            const updatedProducts = [productId, ...viewedProducts.filter((p: string) => p !== productId)].slice(0, 20);

            await updateDoc(userRef, {
                viewedCategories: updatedCategories,
                viewedProducts: updatedProducts,
                lastInteraction: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.error("Error tracking product view:", error);
    }
};
