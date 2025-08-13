
'use server';

/**
 * @fileOverview API endpoint flow to create a new Work Order from an external system.
 * 
 * - createWorkOrderFromApi - Handles the creation of a work order via API call.
 * - CreateWorkOrderInputSchema - The Zod schema for the input data.
 * - CreateWorkOrderInput - The input type for the creation function.
 * - CreateWorkOrderOutput - The output type for the creation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit/zod';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const CreateWorkOrderInputSchema = z.object({
  ot_number: z.string().describe("The unique work order number, including prefix. E.g., 'OT-1525'"),
  description: z.string().describe("The name or description of the work order."),
  client: z.string().describe("The client's name for this work order."),
  service: z.string().describe("The service category, e.g., 'CCTV', 'CCAA'."),
  date: z.string().describe("The start date of the work order in 'YYYY-MM-DD' format."),
  endDate: z.string().optional().describe("The potential end date in 'YYYY-MM-DD' format."),
  notes: z.string().optional().describe("Additional notes or a detailed description."),
  status: z.enum(['Por Iniciar', 'En Progreso', 'Pendiente', 'Atrasada', 'Cerrada']).describe("The initial status of the work order."),
  priority: z.enum(['Baja', 'Media', 'Alta']).describe("The priority of the work order."),
  netPrice: z.number().describe("The net price of the work order."),
  ocNumber: z.string().optional().describe("The Purchase Order (OC) number, if available."),
  invoiceNumber: z.string().optional().describe("The invoice number, if available."),
  assigned: z.array(z.string()).optional().default([]).describe("A list of names for assigned supervisors/managers."),
  technicians: z.array(z.string()).optional().default([]).describe("A list of names for assigned technicians."),
  vehicles: z.array(z.string()).optional().default([]).describe("A list of assigned vehicles."),
  vendedor: z.string().optional().describe("The name of the salesperson."),
});

export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderInputSchema>;

export const CreateWorkOrderOutputSchema = z.object({
  success: z.boolean(),
  orderId: z.string().optional(),
  message: z.string(),
});

export type CreateWorkOrderOutput = z.infer<typeof CreateWorkOrderOutputSchema>;


export const createWorkOrderFlow = ai.defineFlow(
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
        message: `Failed to create work order: ${errorMessage}`,
      };
    }
  }
);

export async function createWorkOrderFromApi(input: CreateWorkOrderInput): Promise<CreateWorkOrderOutput> {
    return await createWorkOrderFlow(input);
}
