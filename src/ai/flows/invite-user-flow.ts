
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
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { AppUser } from '@/lib/types';

export const InviteUserInputSchema = z.object({
  email: z.string().email().describe('The email of the user to invite.'),
  name: z.string().min(3).describe("The full name of the user."),
  role: z.enum(['Admin', 'Supervisor', 'Técnico', 'Visor']).describe('The role to assign to the new user.'),
  password: z.string().min(6).describe("The user's initial password."),
});

export type InviteUserInput = z.infer<typeof InviteUserInputSchema>;

export const InviteUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type InviteUserOutput = z.infer<typeof InviteUserOutputSchema>;
