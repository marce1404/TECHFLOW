
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

let adminApp: admin.app.App | undefined;
let auth: admin.auth.Auth;
let db: admin.firestore.Firestore;

if (!admin.apps.length) {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountBase64) {
        try {
            const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(serviceAccountString);
            adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (e: any) {
            console.error("Firebase Admin SDK initialization failed due to a malformed service account JSON. Admin features will be disabled.", e);
        }
    } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Firebase Admin features will be disabled.");
    }
} else {
    adminApp = admin.apps[0]!;
}

if (adminApp) {
    auth = getAuth(adminApp);
    db = getFirestore(adminApp);
} else {
    // Create mock objects if adminApp is not initialized
    // This allows the app to build and run without crashing, but admin features will fail gracefully.
    auth = {} as admin.auth.Auth;
    db = {} as admin.firestore.Firestore;
}


export { auth, db };


// Server Actions requiring Admin privileges
export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    await auth.deleteUser(uid);
    // Firestore deletion of user profile should be handled via a trigger or manually
    // to keep this action focused on authentication.
    return { success: true, message: 'Usuario eliminado correctamente.' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message || 'Error al eliminar el usuario.' };
  }
}

export async function updateUserAction(uid: string, data: { displayName: string; role: string; status: string }): Promise<{ success: boolean; message: string }> {
    if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
    try {
        await auth.updateUser(uid, {
            displayName: data.displayName,
            disabled: data.status === 'Inactivo',
        });

        const userDocRef = db.collection('users').doc(uid);
        await userDocRef.update({
            displayName: data.displayName,
            role: data.role,
            status: data.status,
        });

        const collaboratorsQuery = db.collection('collaborators').where('email', '==', (await auth.getUser(uid)).email);
        const collaboratorsSnapshot = await collaboratorsQuery.get();
        
        if (!collaboratorsSnapshot.empty) {
            const collaboratorDocRef = collaboratorsSnapshot.docs[0].ref;
            await collaboratorDocRef.update({
                name: data.displayName,
                role: data.role,
                status: data.status,
            });
        }
        
        return { success: true, message: 'Usuario actualizado correctamente.' };
    } catch (error: any) {
        console.error('Error updating user:', error);
        return { success: false, message: error.message || 'Error al actualizar el usuario.' };
    }
}


export async function changeUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    await auth.updateUser(uid, { password: newPassword });
    return { success: true, message: `Contraseña actualizada correctamente.` };
  } catch (error: any) {
    console.error('Error changing password:', error);
    return { success: false, message: error.message || 'Error al cambiar la contraseña.' };
  }
}

export async function toggleUserStatusAction(uid: string, currentStatus: 'Activo' | 'Inactivo'): Promise<{ success: boolean; message: string }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    await auth.updateUser(uid, { disabled: newStatus === 'Inactivo' });
    
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.update({ status: newStatus });
        
    return { success: true, message: 'Estado del usuario actualizado correctamente.' };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, message: error.message || 'Error al cambiar el estado del usuario.' };
  }
}
