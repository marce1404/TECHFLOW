
'use server';

import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  UpdateUserOutput,
  type AppUser,
  type CollaboratorPrintData,
  type GanttChart,
  type UpdateUserInput,
} from '@/lib/types';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import { revalidatePath } from 'next/cache';

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

// These functions still need firebase-admin, but let's see if we can get the user management working first.
// I will temporarily comment them out to avoid build errors.
/*
export async function getCollaboratorForPrint(id: string): Promise<CollaboratorPrintData | null> {
  try {
    await initializeAdminApp();
    const docRef = doc(adminDb(), 'collaborators', id);
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
    await initializeAdminApp();
    const docRef = doc(adminDb(), 'gantt-charts', id);
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
*/

export async function createUserProfileAction(
  userProfile: AppUser
): Promise<{ success: boolean; message: string }> {
  try {
    // We now call our API route to handle user creation securely.
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...userProfile }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Error en la API al crear el perfil de usuario.');
    }
    
    revalidatePath('/settings/users');
    return {
      success: true,
      message: `Perfil de usuario para ${userProfile.displayName} creado con éxito.`,
    };
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    return {
      success: false,
      message: `Error al crear el perfil de usuario: ${error.message}`,
    };
  }
}

export async function updateUserAction(
  input: UpdateUserInput
): Promise<UpdateUserOutput> {
  try {
     const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/users`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.message || 'Error en la API al actualizar el usuario');
    }

    revalidatePath('/settings/users');
    return {
      success: true,
      message: `Usuario ${input.name} actualizado con éxito.`,
    };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return {
      success: false,
      message: `Error al actualizar el usuario: ${error.message}`,
    };
  }
}
