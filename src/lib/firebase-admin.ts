import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

dotenv.config();

const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        return { auth: getAuth(), db: admin.firestore() };
    }

    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountBase64) {
        throw new Error("Firebase service account JSON not found in environment variables. Please set FIREBASE_SERVICE_ACCOUNT_JSON.");
    }

    try {
        const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        return { auth: getAuth(), db: admin.firestore() };
    } catch (error) {
        console.error("Error parsing Firebase service account JSON:", error);
        throw new Error("Failed to initialize Firebase Admin SDK. Service account JSON is invalid.");
    }
};

const { auth, db } = initializeFirebaseAdmin();

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
    
    // The user profile update should be done via `updateUserProfile` in the context
    // which uses the client SDK and respects security rules. This admin action
    // only toggles the auth state.
    
    return { success: true, message: 'Estado del usuario actualizado correctamente.' };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, message: error.message || 'Error al cambiar el estado del usuario.' };
  }
}
