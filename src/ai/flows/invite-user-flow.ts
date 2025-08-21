
'use server';
/**
 * @fileOverview A flow to invite a new user to the application.
 *
 * - inviteUser - Creates a user in Firebase Auth and a corresponding user profile in Firestore.
 * - InviteUserInputSchema - The Zod schema for the input data.
 * - InviteUserOutputSchema - The Zod schema for the output data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { adminApp, adminDb } from '@/lib/firebase-admin';
import { generatePassword } from '@/lib/password-generator';
import type { AppUser } from '@/lib/types';

export const InviteUserInputSchema = z.object({
  email: z.string().email().describe('The email of the user to invite.'),
  name: z.string().min(3).describe("The full name of the user."),
  role: z.enum(['Admin', 'Supervisor', 'Técnico', 'Visor']).describe('The role to assign to the new user.'),
});

export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;

export const InviteUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  tempPassword: z.string().optional(),
});

export type InviteUserOutput = z.infer<typeof InviteUserOutputSchema>;

export const inviteUserFlow = ai.defineFlow(
  {
    name: 'inviteUserFlow',
    inputSchema: InviteUserInputSchema,
    outputSchema: InviteUserOutputSchema,
  },
  async ({ email, name, role }) => {
    try {
      const auth = getAuth(adminApp);
      
      const tempPassword = generatePassword();
      
      // 1. Create user in Firebase Authentication
      const userRecord = await auth.createUser({
        email: email,
        emailVerified: true, // Assuming admin-created users are verified
        password: tempPassword,
        displayName: name,
        disabled: false,
      });

      // 2. Create user profile in Firestore
      const userProfile: AppUser = {
        uid: userRecord.uid,
        email: email,
        displayName: name,
        role: role,
        status: 'Activo',
      };
      
      await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
      
      return {
        success: true,
        message: `Usuario ${name} creado con éxito.`,
        tempPassword: tempPassword,
      };
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/email-already-exists') {
        errorMessage = 'Este correo electrónico ya está registrado en el sistema.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Error inviting user:', error);
      return {
        success: false,
        message: `Error al crear al usuario: ${errorMessage}`,
      };
    }
  }
);

export async function inviteUser(input: InviteUserInput): Promise<InviteUserOutput> {
  return await inviteUserFlow(input);
}
