
'use client';

import { useWorkOrders } from '@/context/work-orders-context';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderCard } from '@/components/dashboard/order-card';
import MotivationalTicker from '@/components/dashboard/motivational-ticker';
import type { WorkOrder } from '@/lib/types';
import { ClosedOrdersCard } from '@/components/dashboard/closed-orders-card';
import React from 'react';
import { normalizeString } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const ITEMS_PER_PAGE = 11;

export default function DashboardPage() {
  const { activeWorkOrders, historicalWorkOrders, loading, ganttCharts } = useWorkOrders();
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  const statusOrder: WorkOrder['status'][] = ['Atrasada', 'En Progreso', 'Pendiente', 'Por Iniciar'];
  
  const finalStatuses = ['cerrada'];
  const filteredActiveOrders = activeWorkOrders.filter(o => !finalStatuses.includes(normalizeString(o.status)));

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
  
  const chunkedOrders = sortedOrders.reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / ITEMS_PER_PAGE)
    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [] // start a new chunk
    }
    resultArray[chunkIndex].push(item)
    return resultArray
  }, [] as WorkOrder[][]);

  const getProgress = (order: WorkOrder) => {
    const assignedGantt = ganttCharts.find(g => g.assignedOT === order.ot_number);
    if (assignedGantt && assignedGantt.tasks.length > 0) {
      const totalProgress = assignedGantt.tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      return Math.round(totalProgress / assignedGantt.tasks.length);
    }
    return order.manualProgress || 0;
  };
  
  const closedOrdersThisMonth = historicalWorkOrders.filter(order => {
      const closingDateStr = order.endDate || order.date;
      if (!closingDateStr) return false;

      const orderDate = new Date(closingDateStr.replace(/-/g, '/'));
      const today = new Date();
      return orderDate.getMonth() === today.getMonth() && orderDate.getFullYear() === today.getFullYear();
  });

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });

    const interval = setInterval(() => {
        if (api.canScrollNext()) {
            api.scrollNext();
        } else {
            api.scrollTo(0);
        }
    }, 15000); // Rotate every 15 seconds

    return () => clearInterval(interval);

  }, [api]);


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
        {chunkedOrders.length > 0 ? (
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {chunkedOrders.map((page, index) => (
                <CarouselItem key={index}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {page.map(order => (
                      <OrderCard key={order.id} order={order} progress={getProgress(order)} />
                    ))}
                    {/* Render the closed orders card only on the first page of the carousel */}
                    {index === 0 && <ClosedOrdersCard orders={closedOrdersThisMonth} />}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="col-span-full flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
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
