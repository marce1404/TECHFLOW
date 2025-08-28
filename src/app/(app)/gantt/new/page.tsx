
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

export default function NewGanttPage() {
  const router = useRouter();
  const { addGanttChart, services, suggestedTasks } = useWorkOrders();
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<GanttTask[]>([]);

  const handleSave = (ganttChartData: Omit<GanttChart, 'id' | 'tasks'>) => {
    const finalTasksToSave = tasks.filter(t => !t.isPhase);
    const finalGantt = { ...ganttChartData, tasks: finalTasksToSave };
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
    
    const seen = new Set();
    const uniqueTasksForCategory = tasksForCategory.filter(t => {
        if (seen.has(t.name)) {
            return false;
        } else {
            seen.add(t.name);
            return true;
        }
    });

    const newTasks: GanttTask[] = [];
    
    if (uniqueTasksForCategory.length > 0) {
        const grouped = uniqueTasksForCategory.reduce((acc, task) => {
            const phase = task.phase || 'Sin Fase';
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(task);
            return acc;
        }, {} as Record<string, SuggestedTask[]>);

        const sortedPhases = Object.keys(grouped).sort((a, b) => {
            const firstTaskOrderA = grouped[a][0]?.order || 0;
            const firstTaskOrderB = grouped[b][0]?.order || 0;
            return firstTaskOrderA - firstTaskOrderB;
        });

        sortedPhases.forEach(phase => {
            newTasks.push({
                id: crypto.randomUUID(),
                name: phase,
                isPhase: true,
                startDate: new Date(),
                duration: 0,
                progress: 0,
                phase: phase,
                order: grouped[phase][0].order,
            });
            const sortedTasksInPhase = grouped[phase].sort((a, b) => (a.order || 0) - (b.order || 0));
            sortedTasksInPhase.forEach(task => {
                newTasks.push({
                    id: crypto.randomUUID(),
                    name: task.name,
                    isPhase: false,
                    startDate: new Date(),
                    duration: 1,
                    progress: 0,
                    phase: phase,
                    order: task.order,
                });
            });
        });
    }
    setTasks(newTasks);
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

      <GanttForm onSave={handleSave} tasks={tasks} setTasks={setTasks} />
    </div>
  );
}
