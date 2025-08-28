
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
    if (initialGanttChart) {
       const sortedTasks = [...(initialGanttChart.tasks || [])].sort((a, b) => {
        if (a.phase && b.phase && a.phase !== b.phase) {
          const firstTaskA = initialGanttChart.tasks.find(t => t.phase === a.phase);
          const firstTaskB = initialGanttChart.tasks.find(t => t.phase === b.phase);
          const orderA = firstTaskA?.order ?? Infinity;
          const orderB = firstTaskB?.order ?? Infinity;
          return orderA - orderB;
        }
        return (a.order || 0) - (b.order || 0);
      });
      setTasks(sortedTasks.map(task => ({
          ...task,
          startDate: task.startDate ? new Date(task.startDate) : new Date(),
        })));
    }
  }, [initialGanttChart]);

  const handleSave = (ganttChartData: Omit<GanttChart, 'id' | 'tasks'>) => {
    const finalGantt = { ...ganttChartData, tasks };
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
