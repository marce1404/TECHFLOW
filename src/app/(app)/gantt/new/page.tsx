
'use client';

import GanttForm from '@/components/gantt/gantt-form';
import { useWorkOrders } from '@/context/work-orders-context';
import { useRouter } from 'next/navigation';
import type { GanttChart, GanttTask, SuggestedTask } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';

export default function NewGanttPage() {
  const router = useRouter();
  const { addGanttChart, services, suggestedTasks } = useWorkOrders();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [tasks, setTasks] = React.useState<GanttTask[]>([]);
  
  const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

  const handleSave = (ganttChartData: Omit<GanttChart, 'id' | 'tasks'>, finalTasks: GanttTask[]) => {
    if (!canCreate) return;
    // Filter out the pseudo-tasks (phase headers) before saving
    const rawTasks = finalTasks.filter(t => !t.isPhase);
    const finalGantt = { ...ganttChartData, tasks: rawTasks };
    addGanttChart(finalGantt);
    toast({
      title: 'Carta Gantt Creada',
      description: `La carta Gantt "${finalGantt.name}" ha sido creada exitosamente.`,
      duration: 2000,
    });
    router.push('/gantt');
  };
  
  const handleSuggestedTasks = (category: string) => {
    const tasksForCategory = suggestedTasks.filter(t => t.category === category);
    
    const uniqueTasksForCategory = Array.from(new Set(tasksForCategory.map(t => t.name)))
      .map(name => tasksForCategory.find(t => t.name === name)!);

    const rawTasks: GanttTask[] = [];
    
    if (uniqueTasksForCategory.length > 0) {
      const sortedTasks = [...uniqueTasksForCategory].sort((a,b) => (a.order || 0) - (b.order || 0));
      sortedTasks.forEach(task => {
          rawTasks.push({
              id: crypto.randomUUID(),
              name: task.name,
              isPhase: false,
              startDate: new Date(),
              duration: 1,
              progress: 0,
              phase: task.phase,
              order: task.order,
          });
      });
    }

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
         setTasks(newProcessedTasks);
      } else {
         setTasks([]);
      }
  }
  
  if (!canCreate) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Acceso Denegado</CardTitle>
                  <CardDescription>No tienes permisos para crear nuevas Cartas Gantt.</CardDescription>
              </CardHeader>
          </Card>
      )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Crear Nueva Carta Gantt
        </h1>
        <p className="text-muted-foreground">
          Completa los detalles para crear una nueva Carta Gantt.
        </p>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Cargar Tareas Sugeridas (Opcional)</CardTitle>
                <CardDescription>Selecciona una categoría para cargar una lista de tareas predefinidas y agilizar la creación de tu cronograma.</CardDescription>
            </CardHeader>
            <CardContent>
                <Label>Cargar Tareas Sugeridas</Label>
                <Select onValueChange={handleSuggestedTasks}>
                <SelectTrigger>
                    <SelectValue placeholder="Seleccionar una categoría de servicio..." />
                </SelectTrigger>
                <SelectContent>
                    {services.filter(s => s.status === 'Activa').map(service => (
                    <SelectItem key={service.id} value={service.name.toLowerCase()}>{service.name}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </CardContent>
        </Card>

      <GanttForm 
        onSave={handleSave} 
        initialTasks={tasks}
      />
    </div>
  );
}
