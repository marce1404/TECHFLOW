
'use client';

import GanttForm from '@/components/gantt/gantt-form';
import { useWorkOrders } from '@/context/work-orders-context';
import { useRouter, useParams } from 'next/navigation';
import type { GanttChart, GanttTask, SuggestedTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';

export default function EditGanttPage() {
  const router = useRouter();
  const params = useParams();
  const { getGanttChart, updateGanttChart } = useWorkOrders();
  const { toast } = useToast();

  const ganttId = params.id as string;
  const initialGanttChart = React.useMemo(() => getGanttChart(ganttId), [ganttId, getGanttChart]);
  
  // This state will hold the final list for rendering, including phase headers
  const [processedTasks, setProcessedTasks] = React.useState<GanttTask[]>([]);

  React.useEffect(() => {
    if (initialGanttChart) {
        const rawTasks = initialGanttChart.tasks.map(task => ({
            ...task,
            startDate: task.startDate ? new Date(task.startDate) : new Date(),
        }));

        const newProcessedTasks: GanttTask[] = [];
        
        if (rawTasks.length > 0) {
            const grouped = rawTasks.reduce((acc, task) => {
                const phase = task.phase || 'Sin Fase';
                if (!acc[phase]) {
                    acc[phase] = [];
                }
                acc[phase].push(task);
                return acc;
            }, {} as Record<string, GanttTask[]>);

            // Sort phases based on the 'order' of the first task in each phase
            const sortedPhases = Object.keys(grouped).sort((a, b) => {
                const firstTaskOrderA = grouped[a][0]?.order || 0;
                const firstTaskOrderB = grouped[b][0]?.order || 0;
                return firstTaskOrderA - firstTaskOrderB;
            });

            sortedPhases.forEach(phase => {
                newProcessedTasks.push({
                    id: crypto.randomUUID(),
                    name: phase,
                    isPhase: true,
                    startDate: new Date(),
                    duration: 0,
                    progress: 0,
                    phase: phase,
                    order: grouped[phase][0]?.order || 0,
                });
                const sortedTasksInPhase = grouped[phase].sort((a, b) => (a.order || 0) - (b.order || 0));
                sortedTasksInPhase.forEach(task => {
                    newProcessedTasks.push(task as GanttTask);
                });
            });
        }
        
        setProcessedTasks(newProcessedTasks);
    }
  }, [initialGanttChart]);

  const handleSave = (ganttChartData: Omit<GanttChart, 'id' | 'tasks'>, finalTasks: GanttTask[]) => {
    // Filter out the pseudo-tasks (phase headers) before saving
    const rawTasks = finalTasks.filter(t => !t.isPhase);
    const finalGantt = { ...ganttChartData, tasks: rawTasks };
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
      <GanttForm 
        onSave={handleSave} 
        ganttChart={initialGanttChart} 
        initialTasks={processedTasks}
      />
    </div>
  );
}
