import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_PRIVATE_KEY || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
            console.error("CRITICAL: Missing Firebase Admin Environment Variables in Vercel.");
            throw new Error("Missing Firebase Admin Environment Variables");
        }
        
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                // Replace escaped newlines from environment variables
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
        console.log("Firebase Admin initialized successfully in Node API.");
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
