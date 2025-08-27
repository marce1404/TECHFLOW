
'use server';

import 'dotenv/config';
import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  type GanttChart,
} from '@/lib/types';

import { suggestOptimalResourceAssignment } from '@/ai/flows/suggest-resource-assignment';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';


// This function ensures Firebase Admin is initialized, but only once.
const initializeFirebaseAdmin = () => {
    if (admin.apps.length > 0) {
        return;
    }

    try {
        const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!serviceAccountBase64) {
            throw new Error("Firebase service account JSON not found in environment variables. Please set FIREBASE_SERVICE_ACCOUNT_JSON.");
        }
        
        const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

    } catch (error: any) {
        console.error('Firebase Admin initialization error', error.message);
        throw new Error('Failed to initialize Firebase Admin SDK: ' + error.message);
    }
};


// --- Server Actions ---

export async function getGanttForPrint(ganttId: string): Promise<GanttChart | null> {
    initializeFirebaseAdmin();
    const db = getFirestore();
    try {
        const ganttRef = db.collection('gantt-charts').doc(ganttId);
        const ganttSnap = await ganttRef.get();

        if (!ganttSnap.exists) {
            console.log("No such Gantt Chart document!");
            return null;
        }

        const data = ganttSnap.data();
        if (!data) return null;
        
        // Correctly handle date conversion from Firestore Timestamp
        const tasks = (data.tasks || []).map((task: any) => {
            const { startDate, ...rest } = task;
            let convertedDate: Date | null = null;
            if (startDate && startDate instanceof Timestamp) {
                convertedDate = startDate.toDate();
            } else if (startDate) {
                // Fallback for string dates, though Timestamps are expected
                convertedDate = new Date(startDate);
            }
            return {
                ...rest,
                startDate: convertedDate,
            };
        });

        return {
            id: ganttSnap.id,
            name: data.name,
            assignedOT: data.assignedOT,
            workOnSaturdays: data.workOnSaturdays,
            workOnSundays: data.workOnSundays,
            tasks: tasks,
        } as GanttChart;

    } catch (error) {
        console.error("Error getting Gantt chart for print:", error);
        return null;
    }
}


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

export async function deleteUserAction(uid: string): Promise<{ success: boolean; message: string }> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    const firestore = getFirestore();

    await auth.deleteUser(uid);
    await firestore.collection('users').doc(uid).delete();

    return { success: true, message: 'Usuario eliminado correctamente.' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { success: false, message: error.message || 'Error al eliminar el usuario.' };
  }
}

export async function changeUserPasswordAction(uid: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    initializeFirebaseAdmin();
    const auth = getAuth();
    await auth.updateUser(uid, { password: newPassword });
    return { success: true, message: `Contraseña actualizada correctamente.` };
  } catch (error: any) {
    console.error('Error changing password:', error);
    return { success: false, message: error.message || 'Error al cambiar la contraseña.' };
  }
}


export async function toggleUserStatusAction(uid: string, currentStatus: 'Activo' | 'Inactivo'): Promise<{ success: boolean; message: string }> {
  try {
    initializeFirebaseAdmin();
    const newStatus = currentStatus === 'Activo' ? 'Inactivo' : 'Activo';
    const auth = getAuth();
    const firestore = getFirestore();

    await auth.updateUser(uid, { disabled: newStatus === 'Inactivo' });
    await firestore.collection('users').doc(uid).update({ status: newStatus });
    
    return { success: true, message: 'Estado del usuario actualizado correctamente.' };
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    return { success: false, message: error.message || 'Error al cambiar el estado del usuario.' };
  }
}
