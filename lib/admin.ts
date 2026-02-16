import { collection, getDocs, doc, updateDoc, query, orderBy, where, limit, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { UserProfile, Withdrawal } from "./users";

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

/**
 * Fetch all transactions in dispute
 */
export const getDisputedTransactions = async () => {
    try {
        const { where, query } = await import("firebase/firestore");
        const txRef = collection(db, "transactions");
        const q = query(txRef, where("status", "==", "DISPUTED"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching disputes:", error);
        return [];
    }
};

/**
 * DEV TOOL: Reset Platform Data (Wipe Transactions, Reset Wallets, Restore Items)
 */
export const resetPlatformData = async () => {
    try {
        const { writeBatch, collection, getDocs, doc, query, where, serverTimestamp } = await import("firebase/firestore");
        const batch = writeBatch(db);
        let operationCount = 0;

        // 1. Delete ALL Transactions
        const txDocs = await getDocs(collection(db, "transactions"));
        txDocs.forEach((doc) => {
            batch.delete(doc.ref);
            operationCount++;
        });

        // 2. Reset ALL User Wallets
        const userDocs = await getDocs(collection(db, "users"));
        userDocs.forEach((userDoc) => {
            batch.update(userDoc.ref, {
                "wallet.available": 0,
                "wallet.inEscrow": 0,
                "wallet.pending": 0,
                "wallet.lastUpdated": serverTimestamp()
            });
            operationCount++;
        });

        // 3. Restore SOLD Items to AVAILABLE
        const itemsRef = collection(db, "items");
        const soldItemsQuery = query(itemsRef, where("status", "==", "SOLD"));
        const soldItemsDocs = await getDocs(soldItemsQuery);

        soldItemsDocs.forEach((itemDoc) => {
            batch.update(itemDoc.ref, {
                status: 'AVAILABLE',
                updatedAt: serverTimestamp()
            });
            operationCount++;
        });

        // Commit Batch
        if (operationCount > 0) {
            await batch.commit();
        }

        return { success: true, count: operationCount };
    } catch (error: any) {
        console.error("Error resetting platform:", error);
        return { success: false, error: error.message };
    }
};

export interface FinancialLog {
    id: string;
    transactionId: string;
    type: 'platform_fee' | 'cancellation_penalty';
    amount: number;
    currency: string;
    relatedUser: string;
    timestamp: any;
}

/**
 * Fetch financial operations history
 */
export const getFinancialLogs = async (): Promise<FinancialLog[]> => {
    try {
        const logsRef = collection(db, "financial_logs");
        const q = query(logsRef, orderBy("timestamp", "desc"), limit(100));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as FinancialLog));
    } catch (error) {
        console.error("Error fetching financial logs:", error);
        return [];
    }
};

/**
 * Fetch all pending withdrawal requests
 */
export const getWithdrawalRequests = async (): Promise<Withdrawal[]> => {
    try {
        const withdrawalsRef = collection(db, "withdrawals");
        const q = query(withdrawalsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Withdrawal));
    } catch (error) {
        console.error("Error fetching withdrawals:", error);
        return [];
    }
};

/**
 * Update withdrawal status (e.g., mark as completed)
 */
export const updateWithdrawalStatus = async (id: string, status: 'completed' | 'rejected') => {
    try {
        const docRef = doc(db, "withdrawals", id);
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error: any) {
        console.error("Error updating withdrawal status:", error);
        return { success: false, error: error.message };
    }
};

/**
 * DELETE ALL ITEMS (DANGER ZONE)
 */
export const clearAllItems = async () => {
    try {
        const { writeBatch, getDocs, collection } = await import("firebase/firestore");
        const itemsRef = collection(db, "items");
        const snapshot = await getDocs(itemsRef);

        if (snapshot.empty) return { success: true, count: 0 };

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return { success: true, count: snapshot.size };
    } catch (error: any) {
        console.error("Error clearing items:", error);
        return { success: false, error: error.message };
    }
};

/**
 * DELETE ALL TRANSACTION DATA (TOTAL DANGER ZONE)
 */
export const clearAllTransactionsHistory = async () => {
    try {
        const { writeBatch, getDocs, collection } = await import("firebase/firestore");

        const collectionsToClear = ["transactions", "withdrawals", "financial_logs"];
        let totalDeleted = 0;

        for (const colName of collectionsToClear) {
            const colRef = collection(db, colName);
            const snapshot = await getDocs(colRef);

            if (!snapshot.empty) {
                const batch = writeBatch(db);
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                totalDeleted += snapshot.size;
            }
        }

        return { success: true, count: totalDeleted };
    } catch (error: any) {
        console.error("Error clearing transaction history:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Get the System Admin ID for fee diversion
 */
export const getSystemAdminId = async (): Promise<string | null> => {
    try {
        const { collection, query, where, orderBy, limit, getDocs } = await import("firebase/firestore");
        const usersRef = collection(db, "users");
        // We find the FIRST user with role 'admin'
        const q = query(usersRef, where("role", "==", "admin"), orderBy("createdAt", "asc"), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }
        return null;
    } catch (error) {
        console.error("Error finding system admin:", error);
        return null;
    }
};
