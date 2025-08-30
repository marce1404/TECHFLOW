
'use server';

/**
 * @fileOverview A simple Genkit flow that passes work order creation requests to a server action.
 * 
 * - createWorkOrderFromApi - Handles passing the creation request.
 */

import { ai } from '@/ai/genkit';
import { CreateWorkOrderInput, CreateWorkOrderInputSchema, CreateWorkOrderOutput, CreateWorkOrderOutputSchema } from '@/lib/types';

// This flow now acts as a simple pass-through. The actual database logic is in actions.ts.
const createWorkOrderFlow = ai.defineFlow(
  {
    name: 'createWorkOrderFlow',
    inputSchema: CreateWorkOrderInputSchema,
    outputSchema: CreateWorkOrderOutputSchema,
  },
  async (input) => {
    // The flow's purpose is just to exist for potential future AI integrations.
    // It immediately returns a success placeholder, as the real work is done in the server action that calls this.
    // This avoids database permission issues within the Genkit flow environment.
    return {
      success: true,
      message: 'Flow received the request. Processing will be handled by the server action.',
    };
  }
);

export async function createWorkOrderFromApi(input: CreateWorkOrderInput): Promise<CreateWorkOrderOutput> {
    // For now, this calls the flow but doesn't use its return value,
    // as the primary database operation is handled directly in the calling server action.
    await createWorkOrderFlow(input);
    
    // Return a placeholder response. The importOrdersFromExcel action will handle the real success/error message.
    return {
      success: true,
      message: "Request passed to flow."
    }
}
