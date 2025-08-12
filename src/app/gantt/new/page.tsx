
'use client';

import GanttForm from '@/components/gantt/gantt-form';
import { useWorkOrders } from '@/context/work-orders-context';
import { useRouter } from 'next/navigation';
import type { GanttChart } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';


export default function NewGanttPage() {
  const router = useRouter();
  const { addGanttChart, services } = useWorkOrders();
  const { toast } = useToast();

  const handleSave = (ganttChart: Omit<GanttChart, 'id'>) => {
    addGanttChart(ganttChart);
    toast({
      title: 'Carta Gantt Creada',
      description: `La carta Gantt "${ganttChart.name}" ha sido creada exitosamente.`,
      duration: 2000,
    });
    router.push('/gantt');
  };

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
      <GanttForm onSave={handleSave} services={services} />
    </div>
  );
}
