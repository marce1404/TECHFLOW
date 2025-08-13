
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
import DashboardStats from '@/components/dashboard/dashboard-stats';

export default function DashboardPage() {
  const { activeWorkOrders, loading } = useWorkOrders();

  const recentWorkOrders = [...activeWorkOrders].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  
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
                            <Skeleton className="h-4 w-2/3" />
                             <Skeleton className="h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/4 mb-2" />
                            <Skeleton className="h-3 w-full" />
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
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="grid grid-cols-5 items-center gap-4 p-2">
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
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-8">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Dashboard
        </h1>
        <DashboardStats />
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
                {recentWorkOrders.length > 0 ? recentWorkOrders.map((order) => (
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
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No hay órdenes de trabajo recientes.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
       <footer className="fixed bottom-0 left-0 right-0 z-10">
            <MotivationalTicker />
        </footer>
    </div>
  );
}
