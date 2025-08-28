
'use client';

import GanttForm from '@/components/gantt/gantt-form';
import { useWorkOrders } from '@/context/work-orders-context';
import { useRouter, useParams } from 'next/navigation';
import type { GanttChart, GanttTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';

export default function EditGanttPage() {
  const router = useRouter();
  const params = useParams();
  const { getGanttChart, updateGanttChart } = useWorkOrders();
  const { toast } = useToast();

  const ganttId = params.id as string;
  const initialGanttChart = React.useMemo(() => getGanttChart(ganttId), [ganttId, getGanttChart]);

  const [tasks, setTasks] = React.useState<GanttTask[]>([]);

  React.useEffect(() => {
    if (initialGanttChart && initialGanttChart.tasks) {
      const allTasks = [...initialGanttChart.tasks].map(task => ({
        ...task,
        startDate: task.startDate ? new Date(task.startDate) : new Date(),
      }));

      // Group tasks by phase
      const groupedByPhase = allTasks.reduce((acc, task) => {
        if (task.isPhase) return acc;
        const phaseName = task.phase || 'Tareas sin Fase';
        if (!acc[phaseName]) {
          acc[phaseName] = [];
        }
        acc[phaseName].push(task);
        return acc;
      }, {} as Record<string, GanttTask[]>);

      // Sort tasks within each phase
      for (const phaseName in groupedByPhase) {
        groupedByPhase[phaseName].sort((a, b) => (a.order || 0) - (b.order || 0));
      }

      // Sort the phases themselves based on the order of their first task
      const sortedPhaseNames = Object.keys(groupedByPhase).sort((a, b) => {
        const orderA = groupedByPhase[a][0]?.order || 0;
        const orderB = groupedByPhase[b][0]?.order || 0;
        return orderA - orderB;
      });
      
      // Reconstruct the tasks array with phases included and sorted
      const sortedTasksWithPhases: GanttTask[] = [];
      sortedPhaseNames.forEach(phaseName => {
        // Find or create the phase task object
        const phaseTaskTemplate = allTasks.find(t => t.isPhase && t.name === phaseName);
        const firstTaskInPhase = groupedByPhase[phaseName][0];
        
        sortedTasksWithPhases.push({
          id: phaseTaskTemplate?.id || crypto.randomUUID(),
          name: phaseName,
          isPhase: true,
          startDate: firstTaskInPhase?.startDate || new Date(),
          duration: 0,
          progress: 0,
          phase: phaseName,
          order: firstTaskInPhase?.order || 0,
        });

        sortedTasksWithPhases.push(...groupedByPhase[phaseName]);
      });

      setTasks(sortedTasksWithPhases);
    }
  }, [initialGanttChart]);


  const handleSave = (ganttChartData: Omit<GanttChart, 'id' | 'tasks'>) => {
    // Filter out phase pseudo-tasks before saving
    const finalTasksToSave = tasks.filter(t => !t.isPhase);
    const finalGantt = { ...ganttChartData, tasks: finalTasksToSave };
    updateGanttChart(ganttId, finalGantt);
    toast({
      title: 'Carta Gantt Actualizada',
      description: `La carta Gantt "${finalGantt.name}" ha sido actualizada exitosamente.`,
      duration: 2000,
    });
    router.push('/gantt');
  };

  if (!initialGanttChart) {
    return <div>Cargando Carta Gantt...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Editar Carta Gantt
        </h1>
        <p className="text-muted-foreground">
          Modifica los detalles de la Carta Gantt.
        </p>
      </div>
      <GanttForm onSave={handleSave} ganttChart={initialGanttChart} tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
