
'use server';

/**
 * @fileOverview API endpoint flow to create a new Work Order from an external system.
 * 
 * - createWorkOrderFromApi - Handles the creation of a work order via API call.
 */

import { ai } from '@/ai/genkit';
import { CreateWorkOrderInput, CreateWorkOrderInputSchema, CreateWorkOrderOutput, CreateWorkOrderOutputSchema } from '@/lib/types';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// This function ensures Firebase Admin is initialized, but only once.
function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        return admin.firestore();
    }

    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountBase64) {
        const errorMsg = "Firebase service account JSON not found in environment variables. Please set FIREBASE_SERVICE_ACCOUNT_JSON.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    
    try {
        const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        return admin.firestore();
    } catch (error: any) {
        console.error('Firebase Admin initialization error:', error);
        throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
    }
}


const createWorkOrderFlow = ai.defineFlow(
  {
    name: 'createWorkOrderFlow',
    inputSchema: CreateWorkOrderInputSchema,
    outputSchema: CreateWorkOrderOutputSchema,
  },
  async (input) => {
    try {
      const firestore = initializeFirebaseAdmin();
      
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

      const docRef = await firestore.collection('work-orders').add(workOrderData);
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
