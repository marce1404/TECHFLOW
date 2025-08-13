
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWorkOrders } from '@/context/work-orders-context';
import { Skeleton } from '@/components/ui/skeleton';
import MotivationalTicker from '@/components/dashboard/motivational-ticker';
import type { WorkOrder } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  const { activeWorkOrders, loading, ganttCharts } = useWorkOrders();

  const ordersToShow = activeWorkOrders
    .filter(order => ['En Progreso', 'Por Iniciar', 'Pendiente', 'Atrasada'].includes(order.status))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusVariant = (
    status: WorkOrder['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Cerrada':
        return 'default';
      case 'En Progreso':
        return 'secondary';
      case 'Atrasada':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getGanttProgress = (otNumber: string) => {
    const assignedGantt = ganttCharts.find(g => g.assignedOT === otNumber);
    if (!assignedGantt || assignedGantt.tasks.length === 0) {
      return 0;
    }
    const totalProgress = assignedGantt.tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / assignedGantt.tasks.length);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Dashboard
        </h1>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Órdenes de Trabajo Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 items-center gap-4 p-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-8 flex-1 pb-16">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Dashboard
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">
              Órdenes de Trabajo Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>OT Nº</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Encargado</TableHead>
                  <TableHead className="w-[150px]">Avance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersToShow.length > 0 ? (
                  ordersToShow.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.ot_number}</TableCell>
                      <TableCell>{order.client}</TableCell>
                      <TableCell>{order.service}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.assigned.join(', ')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Progress value={getGanttProgress(order.ot_number)} className="h-2" />
                            <span className="text-xs text-muted-foreground">{getGanttProgress(order.ot_number)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No hay órdenes de trabajo activas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 z-20">
        <MotivationalTicker />
      </footer>
    </>
  );
}
