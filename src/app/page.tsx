'use client';

import {
  ClipboardList,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
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

export default function DashboardPage() {
  const { activeWorkOrders, technicians, loading } = useWorkOrders();

  const openOrders = activeWorkOrders.length;
  const overdueOrders = activeWorkOrders.filter(o => o.status === 'Atrasada').length;
  const highPriorityOrders = activeWorkOrders.filter(o => o.priority === 'Alta').length;
  const recentWorkOrders = [...activeWorkOrders].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const stats = [
    {
      title: 'OT Abiertas',
      value: openOrders,
      icon: ClipboardList,
      description: 'Órdenes de trabajo activas',
    },
    {
      title: 'OTs Atrasadas',
      value: overdueOrders,
      icon: Clock,
      description: 'Pendientes y fuera de plazo',
    },
    {
      title: 'Técnicos Totales',
      value: technicians.length,
      icon: Users,
      description: 'Equipo de campo disponible',
    },
    {
      title: 'Prioridad Alta',
      value: highPriorityOrders,
      icon: AlertTriangle,
      description: 'Requieren atención inmediata',
    },
    {
      title: 'Cerradas (Mes)',
      value: 0, // This would require more complex date filtering logic
      icon: CheckCircle,
      description: 'Completadas en el mes actual',
    },
  ];

  const getStatusVariant = (
    status: 'Por Iniciar' | 'En Progreso' | 'Pendiente' | 'Atrasada' | 'Cerrada'
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

  if (loading) {
    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-headline font-bold tracking-tight">
                Dashboard
            </h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[50px] mb-2" />
                            <Skeleton className="h-3 w-[150px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">
                        Órdenes de Trabajo Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-2">
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-[80px] rounded-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-headline font-bold tracking-tight">
        Dashboard
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} value={String(stat.value)} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">
            Órdenes de Trabajo Recientes
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentWorkOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.ot_number}</TableCell>
                  <TableCell>{order.client}</TableCell>
                  <TableCell>{order.service}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.assigned}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    