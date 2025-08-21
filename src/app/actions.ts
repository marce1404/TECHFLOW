
'use server';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import { inviteUser } from '@/ai/flows/invite-user-flow';
import { db } from '@/lib/firebase';
import type { 
  CollaboratorPrintData, 
  GanttChart,
  SuggestOptimalResourceAssignmentInput, 
  SuggestOptimalResourceAssignmentOutputWithError,
  InviteUserOutput
} from '@/lib/types';
import { doc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';


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

export async function getGanttForPrint(id: string): Promise<GanttChart | null> {
  try {
    const docRef = doc(db, 'gantt-charts', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
       const data = docSnap.data();
       const tasks = (data.tasks || []).map((task: any) => ({
           ...task,
           startDate: task.startDate instanceof Timestamp ? task.startDate.toDate() : new Date(task.startDate),
       }));
       return { ...data, id: docSnap.id, tasks } as GanttChart;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document:", error);
    return null;
  }
}

export async function inviteUserAction(email: string, name: string): Promise<InviteUserOutput> {
  try {
    const result = await inviteUser({ email, name });
    return result;
  } catch (error: any) {
    console.error('Error inviting user:', error);
    return { success: false, message: error.message || 'An unexpected error occurred.' };
  }
}
