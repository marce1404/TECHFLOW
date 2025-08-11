'use server';

import {
  suggestOptimalResourceAssignment,
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutput,
} from '@/ai/flows/suggest-resource-assignment';
import { z } from 'zod';

const SuggestOptimalResourceAssignmentOutputWithError =
  SuggestOptimalResourceAssignmentOutput.or(z.object({ error: z.string() }));

export async function getResourceSuggestions(
  input: SuggestOptimalResourceAssignmentInput
): Promise<z.infer<typeof SuggestOptimalResourceAssignmentOutputWithError>> {
  try {
    const result = await suggestOptimalResourceAssignment(input);
    return result;
  } catch (error) {
    console.error('Error getting resource suggestions:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
