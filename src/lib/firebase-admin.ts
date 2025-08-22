
import * as admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import 'dotenv/config';
import { firebaseConfig } from './firebase';

let app: App;

export async function initializeAdminApp() {
    if (!admin.apps.length) {
        try {
            const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
                ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
                : undefined;
            
            const credential = serviceAccount 
                ? admin.credential.cert(serviceAccount) 
                : admin.credential.applicationDefault();

            app = admin.initializeApp({
                credential,
                projectId: firebaseConfig.projectId, // Explicitly set the project ID
            });
        } catch (error: any) {
            console.error('Failed to initialize Firebase Admin SDK:', error);
            throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
        }
    } else {
        app = admin.app();
    }
}

export const adminDb = () => admin.firestore();
export const adminAuth = () => admin.auth();
