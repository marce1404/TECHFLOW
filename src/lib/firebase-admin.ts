
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

let adminApp: admin.app.App;

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
    if (serviceAccountBase64) {
        try {
            const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
            const serviceAccount = JSON.parse(serviceAccountString);
            adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (e) {
            console.error("Failed to initialize Firebase Admin with service account from ENV var.", e);
            throw new Error("Firebase Admin SDK initialization failed due to a malformed or missing service account JSON.");
        }
    } else {
        // Fallback for environments where ADC are expected to work (like Google Cloud Run)
        try {
            adminApp = admin.initializeApp();
        } catch (e) {
            console.error("Firebase admin initialization error using Application Default Credentials.", e);
            throw new Error("Firebase Admin SDK initialization failed. No service account JSON found in environment variables and Application Default Credentials could not be used.");
        }
    }
} else {
    adminApp = admin.apps[0]!;
}

const auth = getAuth(adminApp);
const db = getFirestore(adminApp);


export { auth, db };


// Server Actions requiring Admin privileges
export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
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
  try {
    await auth.updateUser(uid, { password: newPassword });
    return { success: true, message: `Contraseña actualizada correctamente.` };
  } catch (error: any) {
    console.error('Error changing password:', error);
    return { success: false, message: error.message || 'Error al cambiar la contraseña.' };
  }
}

export async function toggleUserStatusAction(uid: string, currentStatus: 'Activo' | 'Inactivo'): Promise<{ success: boolean; message: string }> {
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
