
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
        // We can choose to throw the error or handle it gracefully.
        // For now, logging should make the issue clear if credentials are the problem.
    }
}


export const adminApp = admin.apps[0]!;
export const adminDb = admin.firestore();
