
'use server';

/**
 * @fileOverview An AI agent that suggests a list of tasks for a Gantt chart based on a project description.
 *
 * - suggestGanttTasks - A function that suggests tasks for a Gantt chart.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestGanttTasksInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the project for which to suggest Gantt chart tasks.'),
});

export type SuggestGanttTasksInput = z.infer<typeof SuggestGanttTasksInputSchema>;

const TaskSchema = z.object({
    phase: z.string().describe("The phase of the project the task belongs to (e.g., 'Fase 1: Planificación', 'Fase 2: Ejecución')."),
    taskName: z.string().describe("The specific name of the task."),
});

const SuggestGanttTasksOutputSchema = z.object({
    tasks: z.array(TaskSchema).describe("An array of suggested tasks, grouped by phase."),
    justification: z.string().describe("A brief justification for the proposed task structure. RESPONDER EN ESPAÑOL."),
});

export type SuggestGanttTasksOutput = z.infer<typeof SuggestGanttTasksOutputSchema>;

export async function suggestGanttTasks(
  input: SuggestGanttTasksInput
): Promise<SuggestGanttTasksOutput> {
  return suggestGanttTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestGanttTasksPrompt',
  input: {schema: SuggestGanntTasksInputSchema},
  output: {schema: SuggestGanttTasksOutputSchema},
  prompt: `Eres un experto en gestión de proyectos para una empresa de servicios técnicos en áreas como CCTV, control de acceso, y obras civiles.

  Basado en la descripción del proyecto proporcionada, genera una lista detallada de tareas para una Carta Gantt. Agrupa las tareas en fases lógicas (por ejemplo, Planificación, Instalación, Configuración, Puesta en Marcha, Cierre). La respuesta debe ser estructurada y lista para ser implementada en un cronograma.

  Descripción del Proyecto:
  {{{projectDescription}}}

  Considera todos los pasos necesarios desde el inicio hasta el final del proyecto.
  Proporciona una breve justificación de la estructura de fases que has elegido.
  TODA LA RESPUESTA DEBE ESTAR EN ESPAÑOL.
  `,
});

const suggestGanttTasksFlow = ai.defineFlow(
  {
    name: 'suggestGanttTasksFlow',
    inputSchema: SuggestGanttTasksInputSchema,
    outputSchema: SuggestGanttTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
