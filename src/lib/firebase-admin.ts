
'use server';

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


export { auth, db, storage };


// Server Actions requiring Admin privileges

export async function listUsersAction(): Promise<{ success: boolean; users?: AppUser[]; message: string }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    const firestoreDb = getFirestore(adminApp);
    const usersCollection = await firestoreDb.collection('users').get();
    const users = usersCollection.docs.map(doc => doc.data() as AppUser);
    return { success: true, users: users, message: 'Users fetched successfully.' };
  } catch (error: any) {
    console.error('Error listing users:', error);
    return { success: false, message: error.message || 'Error al listar los usuarios.' };
  }
}

export async function createUserAction(data: { email: string; password; displayName: string; role: AppUser['role'] }): Promise<{ success: boolean; message: string; user?: AppUser }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    const adminAuth = getAuth(adminApp);
    const firestoreDb = getFirestore(adminApp);

    const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        disabled: false,
    });
    
    const userProfile: AppUser = {
        uid: userRecord.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        status: 'Activo',
    };

    await firestoreDb.collection('users').doc(userRecord.uid).set(userProfile);
    
    return { success: true, message: 'Usuario creado con éxito.', user: userProfile };

  } catch (error: any) {
    console.error('Error creating user:', error);
    let message = 'Error al crear el usuario.';
    if (error.code === 'auth/email-already-exists') {
        message = 'El correo electrónico ya está en uso.';
    } else if (error.code === 'auth/invalid-password') {
        message = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return { success: false, message };
  }
}


export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    const adminAuth = getAuth(adminApp);
    const firestoreDb = getFirestore(adminApp);
    await adminAuth.deleteUser(uid);
    await firestoreDb.collection('users').doc(uid).delete();
    
    return { success: true, message: 'Usuario eliminado correctamente.' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message || 'Error al eliminar el usuario.' };
  }
}

export async function updateUserAction(uid: string, data: { displayName: string; role: string; status: string }): Promise<{ success: boolean; message: string }> {
    if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
    try {
        const adminAuth = getAuth(adminApp);
        const firestoreDb = getFirestore(adminApp);
        await adminAuth.updateUser(uid, {
            displayName: data.displayName,
            disabled: data.status === 'Inactivo',
        });

        const userDocRef = firestoreDb.collection('users').doc(uid);
        await userDocRef.update({
            displayName: data.displayName,
            role: data.role,
            status: data.status,
        });
        
        return { success: true, message: 'Usuario actualizado correctamente.' };
    } catch (error: any) {
        console.error('Error updating user:', error);
        return { success: false, message: error.message || 'Error al actualizar el usuario.' };
    }
}


export async function changeUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    const adminAuth = getAuth(adminApp);
    await adminAuth.updateUser(uid, { password: newPassword });
    return { success: true, message: `Contraseña actualizada correctamente.` };
  } catch (error: any) {
    console.error('Error changing password:', error);
    return { success: false, message: error.message || 'Error al cambiar la contraseña.' };
  }
}

export async function toggleUserStatusAction(uid: string, currentStatus: 'Activo' | 'Inactivo'): Promise<{ success: boolean; message: string }> {
  if (!adminApp) return { success: false, message: 'Firebase Admin not initialized.' };
  try {
    const adminAuth = getAuth(adminApp);
    const firestoreDb = getFirestore(adminApp);
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    await adminAuth.updateUser(uid, { disabled: newStatus === 'Inactivo' });
    
    const userDocRef = firestoreDb.collection('users').doc(uid);
    await userDocRef.update({ status: newStatus });
        
    return { success: true, message: 'Estado del usuario actualizado correctamente.' };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, message: error.message || 'Error al cambiar el estado del usuario.' };
  }
}
