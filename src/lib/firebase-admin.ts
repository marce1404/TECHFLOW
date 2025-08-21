
'use server';
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

let app: App;

export async function initializeAdminApp() {
    if (!admin.apps.length) {
        try {
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
                : undefined;
            
            app = admin.initializeApp({
                credential: serviceAccount
                    ? admin.credential.cert(serviceAccount)
                    : admin.credential.applicationDefault(),
            });
        } catch (error: any) {
            console.error('Failed to initialize Firebase Admin SDK:', error);
            throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
        }
    }
    return app || admin.app();
}

export const adminDb = () => admin.firestore();
export const adminAuth = () => admin.auth();
