
'use server';

/**
 * @fileOverview API endpoint flow to create a new Work Order from an external system.
 * 
 * - createWorkOrderFromApi - Handles the creation of a work order via API call.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, addDoc, query, where, getDocs, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CreateWorkOrderInput, CreateWorkOrderInputSchema, CreateWorkOrderOutput, CreateWorkOrderOutputSchema } from '@/lib/types';


const createWorkOrderFlow = ai.defineFlow(
  {
    name: 'createWorkOrderFlow',
    inputSchema: CreateWorkOrderInputSchema,
    outputSchema: CreateWorkOrderOutputSchema,
  },
  async (input) => {
    try {
      const workOrderData = {
        ...input,
        facturado: !!input.invoiceNumber,
      };

      const q = query(collection(db, "work-orders"), where("ot_number", "==", input.ot_number));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // OT exists, update it
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, workOrderData);
        return {
          success: true,
          orderId: docRef.id,
          message: `Work order ${input.ot_number} updated successfully.`,
        };
      } else {
        // OT does not exist, create it
        const docRef = await addDoc(collection(db, 'work-orders'), workOrderData);
        return {
          success: true,
          orderId: docRef.id,
          message: 'Work order created successfully.',
        };
      }
    } catch (error) {
      console.error('Error creating or updating work order from API:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return {
        success: false,
        message: `Failed to process work order: ${errorMessage}`,
      };
    }
  }
);

export async function createWorkOrderFromApi(input: CreateWorkOrderInput): Promise<CreateWorkOrderOutput> {
    return await createWorkOrderFlow(input);
}
