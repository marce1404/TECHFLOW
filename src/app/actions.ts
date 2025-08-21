
'use server';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import { adminDb, adminAuth, initializeAdminApp } from '@/lib/firebase-admin';
import type { 
  CollaboratorPrintData, 
  GanttChart,
  SuggestOptimalResourceAssignmentInput, 
  SuggestOptimalResourceAssignmentOutputWithError,
  AppUser,
  UpdateUserInput,
  UpdateUserOutput,
} from '@/lib/types';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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

export async function createUserProfileAction(user: AppUser): Promise<{success: boolean, message: string}> {
  try {
      await initializeAdminApp();
      
      await adminDb().collection('users').doc(user.uid).set(user);
      
      return {
        success: true,
        message: `Perfil de usuario para ${user.displayName} creado con éxito.`,
      };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      let errorMessage = 'Ocurrió un error desconocido.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        success: false,
        message: `Error al crear el perfil de usuario: ${errorMessage}`,
      };
    }
}


export async function updateUserAction(input: UpdateUserInput): Promise<UpdateUserOutput> {
    try {
        await initializeAdminApp();
        const { uid, name, role } = input;
        
        const userRef = adminDb().collection('users').doc(uid);
        await userRef.update({
            displayName: name,
            role: role,
        });
        
        return {
            success: true,
            message: `Usuario ${name} actualizado con éxito.`,
        };
    } catch (error: any) {
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error("Error updating user:", error);
        return {
            success: false,
            message: `Error al actualizar el usuario: ${errorMessage}`,
        };
    }
}

export async function updateUserRoleAction(uid: string, role: AppUser['role']): Promise<{success: boolean, message: string}> {
    try {
        await initializeAdminApp();
        const userRef = adminDb().collection('users').doc(uid);
        await userRef.update({ role });
        return { success: true, message: 'Rol de usuario actualizado correctamente.' };
    } catch (error: any) {
        console.error('Error updating user role:', error);
        return { success: false, message: 'No se pudo actualizar el rol del usuario.' };
    }
}
