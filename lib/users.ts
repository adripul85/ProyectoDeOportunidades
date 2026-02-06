import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
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

