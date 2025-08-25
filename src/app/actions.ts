
'use server';

import {
  SuggestOptimalResourceAssignmentInput,
  SuggestOptimalResourceAssignmentOutputWithError,
  UpdateUserOutput,
  type AppUser,
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

export async function createUserProfileAction(
  userProfile: AppUser
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/users', {
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
     const response = await fetch('/api/users', {
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
