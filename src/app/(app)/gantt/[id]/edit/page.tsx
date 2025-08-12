
'use client';

import GanttForm from '@/components/gantt/gantt-form';
import { useWorkOrders } from '@/context/work-orders-context';
import { useRouter, useParams } from 'next/navigation';
import type { GanttChart } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';

export default function EditGanttPage() {
  const router = useRouter();
  const params = useParams();
  const { getGanttChart, updateGanttChart, services } = useWorkOrders();
  const { toast } = useToast();

  const ganttId = params.id as string;
  const ganttChart = getGanttChart(ganttId);

  const handleSave = (ganttChartData: Omit<GanttChart, 'id'>) => {
    updateGanttChart(ganttId, ganttChartData);
    toast({
      title: 'Carta Gantt Actualizada',
      description: `La carta Gantt "${ganttChartData.name}" ha sido actualizada exitosamente.`,
      duration: 2000,
    });
    router.push('/gantt');
  };

  if (!ganttChart) {
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
      <GanttForm onSave={handleSave} services={services} ganttChart={ganttChart} />
    </div>
  );
}
