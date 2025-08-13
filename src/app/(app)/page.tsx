
'use client';

import { useWorkOrders } from '@/context/work-orders-context';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderCard } from '@/components/dashboard/order-card';
import MotivationalTicker from '@/components/dashboard/motivational-ticker';
import type { WorkOrder } from '@/lib/types';
import { ClosedOrdersCard } from '@/components/dashboard/closed-orders-card';

export default function DashboardPage() {
  const { activeWorkOrders, historicalWorkOrders, loading, ganttCharts } = useWorkOrders();

  const statusOrder: WorkOrder['status'][] = ['Atrasada', 'En Progreso', 'Pendiente', 'Por Iniciar'];

  const ordersToShow = [...activeWorkOrders].sort((a, b) => {
    const statusIndexA = statusOrder.indexOf(a.status);
    const statusIndexB = statusOrder.indexOf(b.status);

    if (statusIndexA !== statusIndexB) {
      return statusIndexA - statusIndexB;
    }

    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getGanttProgress = (otNumber: string) => {
    const assignedGantt = ganttCharts.find(g => g.assignedOT === otNumber);
    if (!assignedGantt || assignedGantt.tasks.length === 0) {
      return 0;
    }
    const totalProgress = assignedGantt.tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / assignedGantt.tasks.length);
  };
  
  const closedOrdersThisMonth = historicalWorkOrders.filter(order => {
      const orderDate = new Date(order.endDate || order.date);
      const today = new Date();
      return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
  });


  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-8">
        {ordersToShow.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ordersToShow.map((order) => (
              <OrderCard key={order.id} order={order} progress={getGanttProgress(order.ot_number)} />
            ))}
            <ClosedOrdersCard orders={closedOrdersThisMonth} />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No hay órdenes de trabajo activas.</p>
            </div>
            <ClosedOrdersCard orders={closedOrdersThisMonth} />
          </div>
        )}
      </div>
      <footer className="fixed bottom-0 left-0 right-0 z-20 w-full peer-data-[state=expanded]:peer-data-[side=left]:pl-[16rem] peer-data-[state=expanded]:peer-data-[side=right]:pr-[16rem] peer-data-[collapsible=icon]:peer-data-[state=expanded]:pl-[16rem] md:peer-data-[state=collapsed]:peer-data-[collapsible=icon]:pl-[3.5rem] transition-[padding] ease-linear">
        <MotivationalTicker />
      </footer>
    </>
  );
}
