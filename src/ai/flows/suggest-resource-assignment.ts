
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
  prompt: `Eres un experto en asignación de recursos para operaciones de servicios técnicos.

  Basado en los requerimientos de la tarea, los técnicos disponibles y los vehículos disponibles, sugiere las asignaciones óptimas para minimizar el tiempo de inactividad y maximizar la eficiencia.

  Requerimientos de la Tarea: {{{taskRequirements}}}
  Técnicos Disponibles: {{{availableTechnicians}}}
  Vehículos Disponibles: {{{availableVehicles}}}

  Considera las habilidades de los técnicos, su carga de trabajo actual y el tipo de vehículo necesario para la tarea.
  Proporciona una justificación clara para tus asignaciones sugeridas.
  TODA LA RESPUESTA DEBE ESTAR EN ESPAÑOL.
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
