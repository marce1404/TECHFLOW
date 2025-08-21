
'use server';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import type { 
  CollaboratorPrintData, 
  GanttChart,
  SuggestOptimalResourceAssignmentInput, 
  SuggestOptimalResourceAssignmentOutputWithError,
  InviteUserOutput,
  InviteUserInput,
  AppUser,
  UpdateUserInput,
  UpdateUserOutput,
} from '@/lib/types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
    const docRef = doc(adminDb, 'collaborators', id);
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
    const docRef = doc(adminDb, 'gantt-charts', id);
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

export async function inviteUserAction(input: InviteUserInput): Promise<InviteUserOutput> {
  try {
      const { email, name, role, password } = input;
      // 1. Create user in Firebase Authentication
      const userRecord = await adminAuth.createUser({
        email: email,
        emailVerified: true, 
        password: password,
        displayName: name,
        disabled: false,
      });

      // 2. Create user profile in Firestore
      const userProfile: AppUser = {
        uid: userRecord.uid,
        email: email,
        displayName: name,
        role: role,
        status: 'Activo',
      };
      
      await adminDb.collection('users').doc(userRecord.uid).set(userProfile);
      
      return {
        success: true,
        message: `Usuario ${name} creado con éxito.`,
      };
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred.';
      if (error.code === 'auth/email-already-exists') {
        errorMessage = 'Este correo electrónico ya está registrado en el sistema.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      console.error('Error inviting user:', error);
      return {
        success: false,
        message: `Error al crear al usuario: ${errorMessage}`,
      };
    }
}

export async function updateUserAction(input: UpdateUserInput): Promise<UpdateUserOutput> {
    try {
        const { uid, name, role } = input;
        // 1. Update user in Firebase Authentication
        await adminAuth.updateUser(uid, {
            displayName: name,
        });

        // 2. Update user profile in Firestore
        const userRef = adminDb.collection('users').doc(uid);
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
        if (error.message) {
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
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.update({ role });
        return { success: true, message: 'Rol de usuario actualizado correctamente.' };
    } catch (error: any) {
        console.error('Error updating user role:', error);
        return { success: false, message: 'No se pudo actualizar el rol del usuario.' };
    }
}
