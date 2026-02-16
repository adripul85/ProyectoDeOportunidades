import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { deleteUser } from "firebase/auth";


// User Profile Interface
export interface UserProfile {
    uid: string;
    displayName: string;
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
    };
    reputation?: {
        averageRating: number;
        totalReviews: number;
        lastUpdated: any;
    };
    followersCount?: number;
    followingCount?: number;

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

        // 2. Update Average Rating (Aggregation)
        // Note: For scalability, this should be a Cloud Function. Here we do client-side agg for MVP.
        const snapshot = await getDocs(reviewsRef);
        let totalStars = 0;
        let count = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            totalStars += data.rating;
            count++;
        });
        const average = count > 0 ? totalStars / count : 0;

        await updateDoc(userRef, {
            "reputation.averageRating": average,
            "reputation.totalReviews": count,
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
