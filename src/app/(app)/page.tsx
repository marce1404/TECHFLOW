

'use client';

import { useWorkOrders } from '@/context/work-orders-context';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderCard } from '@/components/dashboard/order-card';
import MotivationalTicker from '@/components/dashboard/motivational-ticker';
import type { WorkOrder } from '@/lib/types';
import { ClosedOrdersCard } from '@/components/dashboard/closed-orders-card';
import React from 'react';

export default function DashboardPage() {
  const { activeWorkOrders, historicalWorkOrders, loading, ganttCharts } = useWorkOrders();

  const statusOrder: WorkOrder['status'][] = ['Atrasada', 'En Progreso', 'Pendiente', 'Por Iniciar'];
  
  const finalStatuses = ['cerrada', 'facturado'];
  const filteredActiveOrders = activeWorkOrders.filter(o => !finalStatuses.includes(o.status.toLowerCase()));

  const sortedOrders = [...filteredActiveOrders]
    .sort((a, b) => {
      const statusIndexA = statusOrder.indexOf(a.status);
      const statusIndexB = statusOrder.indexOf(b.status);

      if (statusIndexA !== statusIndexB) {
        return statusIndexA - statusIndexB;
      }

      const dateA = new Date(a.date.replace(/-/g, '/')).getTime();
      const dateB = new Date(b.date.replace(/-/g, '/')).getTime();

      return dateB - dateA;
    });

  // Limit active orders to leave space for the fixed closed orders card
  const ordersToShow = sortedOrders.slice(0, 11);

  const getGanttProgress = (otNumber: string) => {
    const assignedGantt = ganttCharts.find(g => g.assignedOT === otNumber);
    if (!assignedGantt || assignedGantt.tasks.length === 0) {
      return 0;
    }
    const totalProgress = assignedGantt.tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / assignedGantt.tasks.length);
  };
  
  const closedOrdersThisMonth = historicalWorkOrders.filter(order => {
      const closingDateStr = order.endDate || order.date;
      if (!closingDateStr) return false;

      const orderDate = new Date(closingDateStr.replace(/-/g, '/'));
      const today = new Date();
      return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
  });


  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ordersToShow.length > 0 ? (
            ordersToShow.map((order) => (
              <OrderCard key={order.id} order={order} progress={getGanttProgress(order.ot_number)} />
            ))
          ) : (
            <div className="col-span-full flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">No hay órdenes de trabajo activas.</p>
            </div>
          )}
          <ClosedOrdersCard orders={closedOrdersThisMonth} />
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 z-20 w-full peer-data-[state=expanded]:peer-data-[side=left]:pl-[16rem] peer-data-[state=expanded]:peer-data-[side=right]:pr-[16rem] peer-data-[collapsible=icon]:peer-data-[state=expanded]:pl-[16rem] md:peer-data-[state=collapsed]:peer-data-[collapsible=icon]:pl-[3.5rem] transition-[padding] ease-linear">
        <MotivationalTicker />
      </footer>
    </>
  );
}
