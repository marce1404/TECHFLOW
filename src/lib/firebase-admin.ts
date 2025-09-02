
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { AppUser } from './types';

dotenv.config();

let adminApp: admin.app.App | null = null;

try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountBase64) {
        if (admin.apps.length === 0) {
             const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
             const serviceAccount = JSON.parse(serviceAccountString);
             adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: `${serviceAccount.project_id}.appspot.com`
            });
        } else {
            adminApp = admin.apps[0];
        }
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Firebase Admin features will be disabled.");
    }
} catch (e: any) {
    console.error("Firebase Admin SDK initialization failed.", e);
    adminApp = null;
}

const auth: admin.auth.Auth | object = adminApp ? getAuth(adminApp) : {};
const db: admin.firestore.Firestore | object = adminApp ? getFirestore(adminApp) : {};
const storage: admin.storage.Storage | object = adminApp ? getStorage(adminApp) : {};

export { auth, db, storage, adminApp };
