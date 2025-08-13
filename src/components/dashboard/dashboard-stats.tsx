
'use client';

import {
  ClipboardList,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import StatCard from '@/components/dashboard/stat-card';
import { useWorkOrders } from '@/context/work-orders-context';

export default function DashboardStats() {
  const { activeWorkOrders, historicalWorkOrders, collaborators } = useWorkOrders();

  const openOrders = activeWorkOrders.length;
  const overdueOrders = activeWorkOrders.filter(o => o.status === 'Atrasada').length;
  const highPriorityOrders = activeWorkOrders.filter(o => o.priority === 'Alta').length;
  
  // This logic should be improved in the future to filter by the current month.
  const closedThisMonth = historicalWorkOrders.length; 

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
      title: 'Colaboradores',
      value: collaborators.length,
      icon: Users,
      description: 'Equipo total disponible',
    },
    {
      title: 'Prioridad Alta',
      value: highPriorityOrders,
      icon: AlertTriangle,
      description: 'Requieren atención inmediata',
    },
    {
      title: 'Cerradas (Mes)',
      value: closedThisMonth, 
      icon: CheckCircle,
      description: 'Completadas en el mes actual',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} value={String(stat.value)} />
      ))}
    </div>
  );
}
