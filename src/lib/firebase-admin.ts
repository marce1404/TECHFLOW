
import * as admin from 'firebase-admin';

const getAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.apps[0]!;
    }

    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : undefined;

    return admin.initializeApp({
        credential: serviceAccount
            ? admin.credential.cert(serviceAccount)
            : admin.credential.applicationDefault(),
    });
};

export const adminApp = getAdminApp();
export const adminDb = admin.firestore();
