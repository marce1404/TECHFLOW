
'use server';
/**
 * @fileOverview A flow to update a user's details.
 *
 * - updateUser - Updates a user's name and role in Firebase Auth and Firestore.
 */

import { ai } from '@/ai/genkit';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, adminDb } from '@/lib/firebase-admin';
import { UpdateUserInputSchema, UpdateUserOutputSchema, type UpdateUserInput, type UpdateUserOutput } from '@/lib/types';


export const updateUserFlow = ai.defineFlow(
  {
    name: 'updateUserFlow',
    inputSchema: UpdateUserInputSchema,
    outputSchema: UpdateUserOutputSchema,
  },
  async ({ uid, name, role }) => {
    try {
      const auth = getAuth(adminApp);
      
      // 1. Update user in Firebase Authentication
      await auth.updateUser(uid, {
        displayName: name,
      });

      // 2. Update user profile in Firestore
      const userRef = adminDb.collection('users').doc(uid);
      await userRef.update({
        displayName: name,
        role: role,
      });
      
      return {
        success: true,
        message: `Usuario ${name} actualizado con éxito.`,
      };
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred.';
      if (error.message) {
        errorMessage = error.message;
      }
      console.error("Error updating user:", error);
      return {
        success: false,
        message: `Error al actualizar el usuario: ${errorMessage}`,
      };
    }
  }
);

export async function updateUser(input: UpdateUserInput): Promise<UpdateUserOutput> {
  return await updateUserFlow(input);
}
