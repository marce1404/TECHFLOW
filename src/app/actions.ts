
'use server';

import {
  suggestOptimalResourceAssignment,
  type SuggestOptimalResourceAssignmentInput,
  type SuggestOptimalResourceAssignmentOutputWithError,
} from '@/ai/flows/suggest-resource-assignment';
import { db } from '@/lib/firebase';
import type { CollaboratorPrintData } from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';


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

export async function getCollaboratorForPrint(id: string): Promise<CollaboratorPrintData | null> {
  try {
    const docRef = doc(db, 'collaborators', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as CollaboratorPrintData;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
}
