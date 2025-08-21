
'use server';
/**
 * @fileOverview A flow to update a user's details.
 *
 * - updateUser - Updates a user's name and role in Firebase Auth and Firestore.
 */

import { ai } from '@/ai/genkit';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { UpdateUserInputSchema, UpdateUserOutputSchema, type UpdateUserInput, type UpdateUserOutput } from '@/lib/types';
