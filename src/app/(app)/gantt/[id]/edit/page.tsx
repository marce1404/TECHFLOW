
'use client';

import GanttForm from '@/components/gantt/gantt-form';
import { useWorkOrders } from '@/context/work-orders-context';
import { useRouter, useParams } from 'next/navigation';
import type { GanttChart, GanttTask, SuggestedTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function EditGanttPage() {
  const router = useRouter();
  const params = useParams();
  const { getGanttChart, updateGanttChart, deleteGanttChart } = useWorkOrders();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const ganttId = params.id as string;
  
  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';
  const [processedTasks, setProcessedTasks] = React.useState<GanttTask[]>([]);
  const initialGanttChart = React.useMemo(() => getGanttChart(ganttId), [ganttId, getGanttChart]);

  React.useEffect(() => {
    if (initialGanttChart && initialGanttChart.tasks) {
      const rawTasks = initialGanttChart.tasks.map(task => ({
        ...task,
        startDate: task.startDate ? (task.startDate instanceof Date ? task.startDate : new Date(task.startDate)) : new Date(),
      }));
  
      if (rawTasks.length > 0) {
        const grouped = rawTasks.reduce((acc, task) => {
          const phase = task.phase || 'Sin Fase';
          if (!acc[phase]) {
            acc[phase] = [];
          }
          acc[phase].push(task);
          return acc;
        }, {} as Record<string, GanttTask[]>);
  
        const sortedPhases = Object.keys(grouped).sort((a, b) => {
          const firstTaskOrderA = grouped[a][0]?.order || 0;
          const firstTaskOrderB = grouped[b][0]?.order || 0;
          return firstTaskOrderA - firstTaskOrderB;
        });
  
        const newProcessedTasks: GanttTask[] = [];
        sortedPhases.forEach(phase => {
          newProcessedTasks.push({
            id: `phase_${phase}_${crypto.randomUUID()}`,
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
            newProcessedTasks.push(task);
          });
        });
         setProcessedTasks(newProcessedTasks);
      } else {
         setProcessedTasks([]);
      }
    }
  }, [initialGanttChart]);

  if (!initialGanttChart) {
    return <div>Cargando Carta Gantt...</div>;
  }

  const handleSave = (ganttChartData: Omit<GanttChart, 'id' | 'tasks'>, finalTasks: GanttTask[]) => {
    if (!canEdit) return;
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

  const handleDelete = async () => {
    if (!initialGanttChart || !canEdit) return;
    await deleteGanttChart(ganttId);
    toast({
        title: "Carta Gantt Eliminada",
        description: `La carta Gantt "${initialGanttChart.name}" ha sido eliminada.`,
        duration: 2000,
    });
    router.push('/gantt');
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Editar Carta Gantt
        </h1>
        <p className="text-muted-foreground">
          {canEdit ? 'Modifica los detalles de la Carta Gantt.' : 'No tienes permisos para editar esta Carta Gantt.'}
        </p>
      </div>
      <GanttForm 
        onSave={handleSave} 
        ganttChart={initialGanttChart} 
        initialTasks={processedTasks}
        disabled={!canEdit}
      />
      {canEdit && (
        <div className="flex justify-between items-center mt-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!canEdit}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Carta Gantt
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de que desea eliminar esta Carta Gantt?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es permanente y no se puede deshacer. Se eliminará la carta gantt "{initialGanttChart.name}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      )}
    </div>
  );
}
