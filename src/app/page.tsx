import {
  ClipboardList,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { overviewStats } from '@/lib/placeholder-data';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { recentWorkOrders } from '@/lib/placeholder-data';

export default function DashboardPage() {
  const stats = [
    {
      title: 'OT Abiertas',
      value: overviewStats.open,
      icon: ClipboardList,
      description: 'Órdenes de trabajo activas',
    },
    {
      title: 'OTs Atrasadas',
      value: overviewStats.overdue,
      icon: Clock,
      description: 'Pendientes y fuera de plazo',
    },
    {
      title: 'Técnicos Totales',
      value: overviewStats.totalTechnicians,
      icon: Users,
      description: 'Equipo de campo disponible',
    },
    {
      title: 'Prioridad Alta',
      value: overviewStats.highPriority,
      icon: AlertTriangle,
      description: 'Requieren atención inmediata',
    },
    {
      title: 'Cerradas (Mes)',
      value: overviewStats.closedThisMonth,
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

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-headline font-bold tracking-tight">
        Dashboard
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
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
