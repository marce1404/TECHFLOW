
'use server';

/**
 * @fileOverview An AI agent that suggests optimal technician and vehicle assignments based on task requirements and resource availability.
 *
 * - suggestOptimalResourceAssignment - A function that suggests optimal resource assignments.
 */

import {ai} from '@/ai/genkit';
import {
    SuggestOptimalResourceAssignmentInput,
    SuggestOptimalResourceAssignmentInputSchema,
    SuggestOptimalResourceAssignmentOutput,
    SuggestOptimalResourceAssignmentOutputSchema
} from '@/lib/types';


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
