
'use server';

import 'dotenv/config';
import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  UpdateUserOutput,
  type AppUser,
  type UpdateUserInput,
} from '@/lib/types';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import { revalidatePath } from 'next/cache';
import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/lib/firebase';

// --- Firebase Admin SDK Initialization (Self-contained) ---

function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : undefined;

  if (!serviceAccount) {
    throw new Error('Firebase service account key not found in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: firebaseConfig.projectId,
  });
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

export async function createUserProfileAction(
  userProfile: AppUser
): Promise<{ success: boolean; message: string }> {
  try {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();
    await db.collection('users').doc(userProfile.uid).set(userProfile);

    revalidatePath('/settings/users');
    return {
      success: true,
      message: `Perfil de usuario para ${userProfile.displayName} creado con éxito.`,
    };
  } catch (error: any) {
    console.error('Error creating user profile in action:', error);
    return {
      success: false,
      message: `Error al crear el perfil de usuario: ${error.message}`,
    };
  }
}

export async function updateUserAction(
  input: UpdateUserInput
): Promise<UpdateUserOutput> {
  try {
    const adminApp = initializeAdminApp();
    const db = adminApp.firestore();
    const auth = adminApp.auth();
    
    const { uid, name, role } = input;

    // Update Firestore document
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      displayName: name,
      role: role,
    });

    // Update Firebase Auth display name
    await auth.updateUser(uid, {
        displayName: name
    });

    revalidatePath('/settings/users');
    return {
      success: true,
      message: `Usuario ${input.name} actualizado con éxito.`,
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return {
      success: false,
      message: `Error al actualizar el usuario: ${error.message}`,
    };
  }
}
