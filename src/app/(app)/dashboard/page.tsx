
'use client';

import { useWorkOrders } from '@/context/work-orders-context';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderCard } from '@/components/dashboard/order-card';
import type { WorkOrder } from '@/lib/types';
import { ClosedOrdersCard } from '@/components/dashboard/closed-orders-card';
import React from 'react';
import { normalizeString } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Expand, Shrink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpirationAlertsCard } from '@/app/(app)/dashboard/expiration-alerts-card';
import { differenceInDays, parseISO, addYears } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import MotivationalTicker from '@/components/dashboard/motivational-ticker';

export default function DashboardPage() {
  const { workOrders, loading, ganttCharts, collaborators } = useWorkOrders();
  const { user, loading: authLoading } = useAuth();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const dashboardRef = React.useRef<HTMLDivElement>(null);

  const activeWorkOrders = React.useMemo(() => {
    return workOrders.filter(o => normalizeString(o.status) !== 'cerrada');
  }, [workOrders]);
  
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

  const getProgress = (order: WorkOrder) => {
    const assignedGantt = ganttCharts.find(g => g.assignedOT === order.ot_number);
    if (assignedGantt && assignedGantt.tasks.length > 0) {
      const totalProgress = assignedGantt.tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      return Math.round(totalProgress / assignedGantt.tasks.length);
    }
    return order.manualProgress || 0;
  };
  
    const closedOrdersThisMonth = workOrders.filter(order => {
        if (normalizeString(order.status) !== 'cerrada' || !order.endDate) {
            return false;
        }

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        const closingDate = new Date(order.endDate.replace(/-/g, '/'));

        return closingDate.getMonth() === currentMonth && closingDate.getFullYear() === currentYear;
    });

    const expiringItems = React.useMemo(() => {
        if (loading || authLoading) return [];

        const alerts: {
            collaboratorName: string;
            itemName: string;
            daysUntilExpiration: number;
            expirationDate: string;
        }[] = [];
        const today = new Date();
        
        collaborators.forEach(c => {
            const allItems = [
                ...(c.workClothing || []),
                ...(c.epp || []),
                ...(c.certifications || []),
            ];

            allItems.forEach(item => {
                if (!item) return;
                
                let expiration: Date | null = null;
                let expirationDateStr: string | undefined = undefined;

                if ('expirationDate' in item && item.expirationDate) {
                    expiration = parseISO(item.expirationDate);
                    expirationDateStr = item.expirationDate;
                } else if ('deliveryDate' in item && item.deliveryDate) {
                    expiration = addYears(parseISO(item.deliveryDate), 1);
                    expirationDateStr = expiration.toISOString().split('T')[0];
                } else if ('issueDate' in item && item.issueDate) {
                    expiration = addYears(parseISO(item.issueDate), 1);
                    expirationDateStr = expiration.toISOString().split('T')[0];
                }

                if (expiration && expirationDateStr) {
                    const daysUntilExpiration = differenceInDays(expiration, today);
                    if (daysUntilExpiration <= 60) {
                        alerts.push({
                            collaboratorName: c.name,
                            itemName: ('item' in item ? item.item : item.name) || 'Documento sin nombre',
                            daysUntilExpiration,
                            expirationDate: expirationDateStr,
                        });
                    }
                }
            });
        });

        return alerts.sort((a,b) => a.daysUntilExpiration - b.daysUntilExpiration);
    }, [collaborators, loading, authLoading]);

  const toggleFullscreen = () => {
    if (!dashboardRef.current) return;

    if (!document.fullscreenElement) {
      dashboardRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col gap-8 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  const animationDuration = Math.max(30, sortedOrders.length * 1.5);

  const OrderGrid = ({ orders }: { orders: WorkOrder[] }) => (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
        isFullscreen ? "p-4" : "p-4 sm:p-6 lg:p-8"
      )}
    >
      <div className="md:col-span-1"><ClosedOrdersCard orders={closedOrdersThisMonth} /></div>
      <div className="md:col-span-1"><ExpirationAlertsCard items={expiringItems} /></div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} progress={getProgress(order)} />
      ))}
    </div>
  );

  return (
     <div 
        ref={dashboardRef} 
        className={cn(
            "flex flex-col bg-background", 
            isFullscreen ? "h-screen overflow-hidden" : "h-full"
        )}
     >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-end">
                <Button onClick={toggleFullscreen} variant="outline" size="icon">
                    {isFullscreen ? <Shrink className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
                    <span className="sr-only">{isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}</span>
                </Button>
            </div>
        </div>

        {/* Main Content */}
        {isFullscreen ? (
          <div className="flex-1 overflow-hidden h-full">
            <div 
              className="animate-scroll-vertical h-full" 
              style={{ '--animation-duration': `${animationDuration}s` } as React.CSSProperties}
            >
              <OrderGrid orders={sortedOrders} />
              <OrderGrid orders={sortedOrders} /> {/* Duplicate for seamless loop */}
            </div>
          </div>
        ) : (
          <div className="flex-1">
             <OrderGrid orders={sortedOrders} />
             {sortedOrders.length === 0 && (
                <div className="col-span-full flex items-center justify-center h-64 border-2 border-dashed rounded-lg m-8">
                    <p className="text-muted-foreground">No hay órdenes de trabajo activas.</p>
                </div>
            )}
          </div>
        )}
        
        {/* Footer */}
        {isFullscreen && (
            <footer className="w-full shrink-0">
                <MotivationalTicker />
            </footer>
        )}
    </div>
  );
}
