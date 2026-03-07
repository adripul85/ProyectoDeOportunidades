import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export type QuestionStatus = 'pending' | 'answered';

export interface QuestionData {
    itemId: string;
    questionText: string;
    answerText?: string;
    askedBy: string;
    askedByName: string;
    askedByAvatar: string;
    answeredBy?: string;
    answeredAt?: any;
    createdAt: any;
    status: QuestionStatus;
}

// Ask a new question
export const askQuestion = async (
    itemId: string,
    questionText: string,
    userId: string,
    userName: string,
    userAvatar: string,
    sellerId: string, // Added to notify the seller
    itemTitle: string // Added for better notification message
) => {
    try {
        const docRef = await addDoc(collection(db, "questions"), {
            itemId,
            questionText,
            askedBy: userId,
            askedByName: userName,
            askedByAvatar: userAvatar,
            status: 'pending' as QuestionStatus,
            createdAt: serverTimestamp(),
        });

        // Notify the seller
        const { sendNotification } = await import("./interactions");
        await sendNotification(sellerId, {
            title: 'Nueva Pregunta',
            message: `${userName} ha preguntado en "${itemTitle}": "${questionText.substring(0, 50)}${questionText.length > 50 ? '...' : ''}"`,
            type: 'info',
            link: `/product/${itemId}`
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error asking question:", error);
        return { success: false, error };
    }
};

// Get all questions for a product
export const getQuestions = async (itemId: string): Promise<(QuestionData & { id: string })[]> => {
    try {
        const q = query(
            collection(db, "questions"),
            where("itemId", "==", itemId),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (QuestionData & { id: string })[];
    } catch (error) {
        console.error("Error fetching questions:", error);
        return [];
    }
};

// Answer a question (seller only)
export const answerQuestion = async (
    questionId: string,
    answerText: string,
    sellerId: string,
    buyerId: string, // Added to notify the buyer
    itemId: string, // Added for navigation link
    itemTitle: string // Added for better notification message
) => {
    try {
        const docRef = doc(db, "questions", questionId);
        await updateDoc(docRef, {
            answerText,
            answeredBy: sellerId,
            answeredAt: serverTimestamp(),
            status: 'answered' as QuestionStatus,
        });

        // Notify the buyer
        const { sendNotification } = await import("./interactions");
        await sendNotification(buyerId, {
            title: 'Pregunta Respondida',
            message: `El vendedor ha respondido tu duda en "${itemTitle}".`,
            type: 'success',
            link: `/product/${itemId}`
        });

        return { success: true };
    } catch (error) {
        console.error("Error answering question:", error);
        return { success: false, error };
    }
};

// Delete a question (optional - for moderation)
export const deleteQuestion = async (questionId: string) => {
    try {
        // In a real app, you'd use deleteDoc from firebase/firestore
        // For now, we'll just mark it as deleted by updating status
        const docRef = doc(db, "questions", questionId);
        await updateDoc(docRef, {
            status: 'deleted' as any,
        });

        return { success: true };
    } catch (error) {
        console.error("Error deleting question:", error);
        return { success: false, error };
    }
};

// Subscribe to questions (Real-time)
export const subscribeToQuestions = (itemId: string, callback: (questions: (QuestionData & { id: string })[]) => void) => {
    const q = query(
        collection(db, "questions"),
        where("itemId", "==", itemId),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const questions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as (QuestionData & { id: string })[];
        callback(questions);
    });
};
