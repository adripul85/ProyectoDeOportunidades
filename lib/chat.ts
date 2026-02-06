import { db } from "./firebase";
import { getUserProfile } from "./users";
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    Timestamp,
    doc,
    updateDoc,
    serverTimestamp,
    getDocs,
    limit,
    getDoc,
    deleteDoc
} from "firebase/firestore";

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: Timestamp;
    read: boolean;
    type?: 'text' | 'image';
    image?: string;
}

export interface Chat {
    id: string;
    participants: string[];
    participantsData?: Record<string, { displayName: string, photoURL: string }>;
    lastMessage: string;
    lastMessageTimestamp: Timestamp;
    unreadCount: Record<string, number>;
    type?: 'private' | 'support';
    archivedBy?: string[];
}

// Start a chat or return existing one
export const startChat = async (currentUserId: string, otherUserId: string, otherUserData?: { displayName: string, photoURL: string }) => {
    try {
        // Check if chat already exists
        const chatsRef = collection(db, "chats");
        const q = query(chatsRef, where("participants", "array-contains", currentUserId));
        const querySnapshot = await getDocs(q);

        const existingChat = querySnapshot.docs.find(doc => {
            const data = doc.data();
            return data.participants.includes(otherUserId);
        });

        if (existingChat) {
            return existingChat.id;
        }

        // Create new chat
        const newChatData = {
            participants: [currentUserId, otherUserId],
            participantsData: otherUserData ? {
                [otherUserId]: otherUserData
            } : {},
            lastMessage: '',
            lastMessageTimestamp: serverTimestamp(),
            unreadCount: {
                [currentUserId]: 0,
                [otherUserId]: 0
            },
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(chatsRef, newChatData);
        return docRef.id;
    } catch (error) {
        console.error("Error starting chat:", error);
        throw error;
    }
};

// Send a message
export const sendMessage = async (chatId: string, senderId: string, text: string, image?: string) => {
    try {
        const messagesRef = collection(db, "chats", chatId, "messages");
        const messageData: any = {
            text: text || '',
            senderId,
            createdAt: serverTimestamp(),
            read: false,
            type: image ? 'image' : 'text'
        };
        if (image) messageData.image = image;

        await addDoc(messagesRef, messageData);

        // Update chat metadata
        const chatRef = doc(db, "chats", chatId);

        // We need to atomically increment unread count for the OTHER participant
        // but since we don't know who the other is without reading, we do a simple read first or assume array logic
        // For simplicity, we'll fetch the chat to identify participant
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data() as Chat;

        const otherUserId = chatData.participants.find(p => p !== senderId);

        const updates: any = {
            lastMessage: text,
            lastMessageTimestamp: serverTimestamp()
        };

        if (otherUserId) {
            updates[`unreadCount.${otherUserId}`] = (chatData.unreadCount?.[otherUserId] || 0) + 1;
        }

        await updateDoc(chatRef, updates);

        // Check for AI Auto-Reply
        if (otherUserId) {
            checkAndTriggerAutoReply(chatId, otherUserId, text);
        }

        return true;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

// AI Response Simulation
const checkAndTriggerAutoReply = async (chatId: string, recipientId: string, userMessage: string) => {
    try {
        // If user has no profile, assume it's a bot/simulated user
        const profile = await getUserProfile(recipientId);

        if (!profile) {
            // It's a bot! Trigger response.
            const responseText = generateAIResponse(userMessage);
            const delay = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s delay

            setTimeout(async () => {
                try {
                    const messagesRef = collection(db, "chats", chatId, "messages");
                    await addDoc(messagesRef, {
                        text: responseText,
                        senderId: recipientId,
                        createdAt: serverTimestamp(),
                        read: false
                    });

                    const chatRef = doc(db, "chats", chatId);
                    const chatSnap = await getDoc(chatRef);
                    if (!chatSnap.exists()) return;

                    const chatData = chatSnap.data() as Chat;
                    // Update last message and unread count for the REAL user (who is not the recipientId here)
                    const realUserId = chatData.participants.find(p => p !== recipientId);

                    const updates: any = {
                        lastMessage: responseText,
                        lastMessageTimestamp: serverTimestamp()
                    };

                    if (realUserId) {
                        updates[`unreadCount.${realUserId}`] = (chatData.unreadCount?.[realUserId] || 0) + 1;
                    }

                    await updateDoc(chatRef, updates);
                } catch (err) {
                    console.error("Error sending auto-reply:", err);
                }
            }, delay);
        }
    } catch (error) {
        console.error("Error checking for auto-reply:", error);
    }
};

const generateAIResponse = (message: string): string => {
    const lower = message.toLowerCase();

    if (lower.includes('precio') || lower.includes('cuanto') || lower.includes('$')) {
        return "El precio es el publicado, pero si te interesa podemos charlarlo un poco. ¿Te sirve?";
    }
    if (lower.includes('disponible') || lower.includes('tenes') || lower.includes('stock')) {
        return "¡Hola! Sí, lo tengo disponible. ¿Te gustaría pasar a verlo o coordinamos envío?";
    }
    if (lower.includes('envio') || lower.includes('envío') || lower.includes('zona')) {
        return "Hago envíos a todo el país o podés retirar por mi domicilio. ¿De dónde sos?";
    }
    if (lower.includes('estado') || lower.includes('funciona') || lower.includes('detalles')) {
        return "Funciona perfecto, está muy bien cuidado. Si querés más fotos avisame.";
    }
    if (lower.includes('hola') || lower.includes('buen')) {
        return "¡Hola! Gracias por consultar. ¿En qué puedo ayudarte con el producto?";
    }

    const defaults = [
        "Dale, cualquier otra duda consultame.",
        "Sí, sigue disponible.",
        "Perfecto, avisame y coordinamos.",
        "Gracias por tu interés."
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
};

// Subscribe to user's chats for the sidebar
export const subscribeToChats = (userId: string, callback: (chats: Chat[]) => void) => {
    const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", userId),
        orderBy("lastMessageTimestamp", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const chats = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Chat[];

        // Filter out archived chats locally for now (or improve query)
        const activeChats = chats.filter(chat => !chat.archivedBy?.includes(userId));
        callback(activeChats);
    });
};

// Subscribe to messages in a specific chat
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Message[];
        callback(messages);
    });
};

// Mark messages as read
export const markChatAsRead = async (chatId: string, userId: string) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        await updateDoc(chatRef, {
            [`unreadCount.${userId}`]: 0
        });
    } catch (error) {
        console.error("Error marking as read:", error);
    }
};

// Delete a chat
export const deleteChat = async (chatId: string) => {
    try {
        await deleteDoc(doc(db, "chats", chatId));
        return true;
    } catch (error) {
        console.error("Error deleting chat:", error);
        throw error;
    }
};

// Archive a chat
export const archiveChat = async (chatId: string, userId: string) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);
        if (chatSnap.exists()) {
            const data = chatSnap.data();
            const currentArchived = data.archivedBy || [];
            if (!currentArchived.includes(userId)) {
                await updateDoc(chatRef, {
                    archivedBy: [...currentArchived, userId]
                });
            }
        }
    } catch (error) {
        console.error("Error archiving chat:", error);
        throw error;
    }
};
