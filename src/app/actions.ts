
'use server';

import 'dotenv/config';
import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  UpdateUserInput,
  UpdateUserOutput,
} from '@/lib/types';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';

// --- Initialize Firebase Admin SDK ---
// This is a robust way to initialize the Admin SDK in a serverless environment like Vercel.
// It checks if the app is already initialized to prevent errors.

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            }),
        });
    } catch (error: any) {
        console.error('Firebase Admin initialization error', error);
    }
}


// --- Server Actions ---

export async function getResourceSuggestions(
  input: SuggestOptimalResourceAssignmentInput
): Promise<SuggestOptimalResourceAssignmentOutputWithError> {
  try {
    const result = await suggestOptimalResourceAssignment(input);
    return result;
  } catch (error) {
    console.error('Error getting resource suggestions:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
  try {
    const auth = getAuth();
    const firestore = getFirestore();

    await auth.deleteUser(uid);
    await firestore.collection('users').doc(uid).delete();

    return { success: true, message: 'Usuario eliminado correctamente.' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message || 'Error al eliminar el usuario.' };
  }
}

export async function resetUserPasswordAction(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const auth = getAuth();
    await auth.generatePasswordResetLink(email);
    return { success: true, message: `Correo para restablecer contraseña enviado a ${email}.` };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { success: false, message: error.message || 'Error al restablecer la contraseña.' };
  }
}


export async function toggleUserStatusAction(uid: string, currentStatus: 'Activo' | 'Inactivo'): Promise<{ success: boolean; message: string }> {
  try {
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    const auth = getAuth();
    const firestore = getFirestore();

    await auth.updateUser(uid, { disabled: newStatus === 'Inactivo' });
    await firestore.collection('users').doc(uid).update({ status: newStatus });
    
    return { success: true, message: 'Estado del usuario actualizado correctamente.' };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, message: error.message || 'Error al cambiar el estado del usuario.' };
  }
}
