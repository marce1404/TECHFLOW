'use server';

import {
  suggestOptimalResourceAssignment,
  type SuggestOptimalResourceAssignmentInput,
  type SuggestOptimalResourceAssignmentOutputWithError,
} from '@/ai/flows/suggest-resource-assignment';

export async function getResourceSuggestions(
  input: SuggestOptimalResourceAssignmentInput
): Promise<SuggestOptimalResourceAssignmentOutputWithError> {
  try {
    const result = await suggestOptimalResourceAssignment(input);
    return result;
  } catch (error) {
    console.error('Error getting resource suggestions:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
