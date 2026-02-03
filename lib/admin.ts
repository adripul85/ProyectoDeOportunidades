import { collection, getDocs, doc, updateDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile } from "./users";

/**
 * Fetch all users from Firestore
 * Note: In a production app, you would implement pagination.
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            ...doc.data()
        } as UserProfile));
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

/**
 * Update a user's verification badges
 */
export const updateUserVerification = async (
    uid: string,
    badges: { identityVerified?: boolean; addressVerified?: boolean; phoneVerified?: boolean }
) => {
    try {
        const userRef = doc(db, "users", uid);
        const updateData: any = {};

        if (badges.identityVerified !== undefined) updateData["verificationBadges.identityVerified"] = badges.identityVerified;
        if (badges.addressVerified !== undefined) updateData["verificationBadges.addressVerified"] = badges.addressVerified;
        if (badges.phoneVerified !== undefined) updateData["verificationBadges.phoneVerified"] = badges.phoneVerified;

        updateData.updatedAt = serverTimestamp();

        await updateDoc(userRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating user verification:", error);
        return { success: false, error };
    }
};

/**
 * Update a user's role
 */
export const updateUserRole = async (uid: string, role: 'admin' | 'moderator' | 'user') => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            role,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating user role:", error);
        return { success: false, error };
    }
};

/**
 * Delete a user by admin
 * Note: For security, you might want to only flag as deleted/banned instead.
 */
export const deleteUserByAdmin = async (uid: string) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            role: 'user', // Reset role
            deleted: true,
            bannedAt: serverTimestamp()
        });
        // Note: Real deletion requires admin privileges or cloud functions
        // For now we mark as banned/deleted in Firestore
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error };
    }
};

/**
 * Update user wallet balances manually
 */
export const updateUserWallet = async (uid: string, wallet: Partial<UserProfile['wallet']>) => {
    try {
        const userRef = doc(db, "users", uid);
        const updateData: any = {};

        if (wallet.available !== undefined) updateData["wallet.available"] = wallet.available;
        if (wallet.inEscrow !== undefined) updateData["wallet.inEscrow"] = wallet.inEscrow;
        if (wallet.pending !== undefined) updateData["wallet.pending"] = wallet.pending;

        updateData["wallet.lastUpdated"] = serverTimestamp();

        await updateDoc(userRef, updateData);
        return { success: true };
    } catch (error) {
        console.error("Error updating wallet:", error);
        return { success: false, error };
    }
};

/**
 * Get aggregate platform stats (Finance Tab)
 */
export const getPlatformStats = async () => {
    try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);

        let totalAvailable = 0;
        let totalInEscrow = 0;
        let totalPending = 0;
        let totalUsers = snapshot.size;

        snapshot.forEach(doc => {
            const data = doc.data() as UserProfile;
            if (data.wallet) {
                totalAvailable += data.wallet.available || 0;
                totalInEscrow += data.wallet.inEscrow || 0;
                totalPending += data.wallet.pending || 0;
            }
        });

        return {
            totalAvailable,
            totalInEscrow,
            totalPending,
            totalSystemValue: totalAvailable + totalInEscrow + totalPending,
            totalUsers
        };
    } catch (error) {
        console.error("Error fetching platform stats:", error);
        return null;
    }
};
