
'use server';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;

        admin.initializeApp({
            credential: serviceAccount
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault(),
        });
    } catch (error: any) {
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
