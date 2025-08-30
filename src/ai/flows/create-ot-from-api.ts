
'use server';

/**
 * @fileOverview API endpoint flow to create a new Work Order from an external system.
 * 
 * - createWorkOrderFromApi - Handles the creation of a work order via API call.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, addDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
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
      
      let finalStatus = input.status;
      if (input.status.toUpperCase() === 'CERRADA') {
        finalStatus = 'Cerrada';
      } else if (input.status === 'En Proceso') {
        finalStatus = 'En Progreso';
      }

      const workOrderData = {
        ...input,
        status: finalStatus,
        facturado: !!input.invoiceNumber,
      };

      // Always create a new work order for each imported row.
      const docRef = await addDoc(collection(db, 'work-orders'), workOrderData);
      return {
        success: true,
        orderId: docRef.id,
        message: 'Work order created successfully.',
      };

    } catch (error) {
      console.error('Error creating work order from API:', error);
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
