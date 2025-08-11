// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview An AI agent that suggests optimal technician and vehicle assignments based on task requirements and resource availability.
 *
 * - suggestOptimalResourceAssignment - A function that suggests optimal resource assignments.
 * - SuggestOptimalResourceAssignmentInput - The input type for the suggestOptimalResourceAssignment function.
 * - SuggestOptimalResourceAssignmentOutput - The return type for the suggestOptimalResourceAssignment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalResourceAssignmentInputSchema = z.object({
  taskRequirements: z
    .string()
    .describe('A description of the task requirements, including skills needed, tools, and time estimate.'),
  availableTechnicians: z
    .string()
    .describe(
      'A list of available technicians with their skills, current workload, and availability.'
    ),
  availableVehicles: z
    .string()
    .describe(
      'A list of available vehicles with their type, capacity, location, and availability.'
    ),
});
export type SuggestOptimalResourceAssignmentInput = z.infer<
  typeof SuggestOptimalResourceAssignmentInputSchema
>;

export const SuggestOptimalResourceAssignmentOutputSchema = z.object({
  suggestedTechnicians: z
    .string()
    .describe('A list of suggested technicians for the task.'),
  suggestedVehicles: z.string().describe('A list of suggested vehicles for the task.'),
  justification: z
    .string()
    .describe(
      'A justification for the suggested assignments, considering task requirements and resource availability.'
    ),
});
export type SuggestOptimalResourceAssignmentOutput = z.infer<
  typeof SuggestOptimalResourceAssignmentOutputSchema
>;

export const SuggestOptimalResourceAssignmentOutputWithErrorSchema =
  SuggestOptimalResourceAssignmentOutputSchema.or(z.object({ error: z.string() }));

export type SuggestOptimalResourceAssignmentOutputWithError = z.infer<
    typeof SuggestOptimalResourceAssignmentOutputWithErrorSchema
    >;


export async function suggestOptimalResourceAssignment(
  input: SuggestOptimalResourceAssignmentInput
): Promise<SuggestOptimalResourceAssignmentOutput> {
  return suggestOptimalResourceAssignmentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalResourceAssignmentPrompt',
  input: {schema: SuggestOptimalResourceAssignmentInputSchema},
  output: {schema: SuggestOptimalResourceAssignmentOutputSchema},
  prompt: `You are an expert in resource allocation for technical service operations.

  Based on the task requirements, available technicians, and available vehicles, suggest the optimal assignments to minimize downtime and maximize efficiency.

  Task Requirements: {{{taskRequirements}}}
  Available Technicians: {{{availableTechnicians}}}
  Available Vehicles: {{{availableVehicles}}}

  Consider the skills of the technicians, their current workload, and the type of vehicle needed for the task.
  Provide a clear justification for your suggested assignments.
  `,
});

const suggestOptimalResourceAssignmentFlow = ai.defineFlow(
  {
    name: 'suggestOptimalResourceAssignmentFlow',
    inputSchema: SuggestOptimalResourceAssignmentInputSchema,
    outputSchema: SuggestOptimalResourceAssignmentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
