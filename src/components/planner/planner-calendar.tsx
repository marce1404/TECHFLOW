
'use client';

import * as React from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  add,
  isSameDay,
  parseISO
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkOrder } from '@/lib/types';
import { cn, normalizeString } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '../ui/badge';

interface PlannerCalendarProps {
  workOrders: WorkOrder[];
}

export function PlannerCalendar({ workOrders }: PlannerCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth, { locale: es }),
    end: endOfWeek(lastDayOfMonth, { locale: es }),
  });
  
  const getStatusColorClass = (status: WorkOrder['status']) => {
    switch (normalizeString(status)) {
      case 'atrasada':
        return 'bg-destructive/80 border-destructive';
      case 'cerrada':
        return 'bg-gray-400/80 border-gray-500';
      case 'en progreso':
        return 'bg-green-500/80 border-green-600';
      case 'por iniciar':
        return 'bg-primary/80 border-primary';
      case 'pendiente':
        return 'bg-yellow-500/80 border-yellow-600';
      default:
        return 'bg-secondary border-border';
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(add(currentMonth, { months: -1 }));
  };

  const handleNextMonth = () => {
    setCurrentMonth(add(currentMonth, { months: 1 }));
  };

  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold capitalize font-headline">
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground border-b border-r">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-5 h-[calc(100vh-20rem)]">
        {daysInMonth.map((day, dayIdx) => {
          const ordersForDay = workOrders.filter((order) =>
            isSameDay(parseISO(order.date), day)
          );

          return (
            <div
              key={day.toString()}
              className={cn(
                'border-b border-r p-2 flex flex-col',
                isSameMonth(day, currentMonth) ? 'bg-card' : 'bg-muted/50',
                'min-h-[120px]'
              )}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn(
                  'text-sm font-medium',
                  isToday(day) && 'flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground'
                )}
              >
                {format(day, 'd')}
              </time>
              <div className="flex-1 mt-1 space-y-1 overflow-y-auto">
                {ordersForDay.map((order) => (
                  <Link key={order.id} href={`/orders/${order.id}/edit`}>
                    <div
                      className={cn(
                        'text-xs rounded-md p-1 text-white hover:opacity-80 transition-opacity',
                        getStatusColorClass(order.status)
                      )}
                    >
                      <p className="font-bold truncate">{order.ot_number}</p>
                      <p className="truncate text-white/90">{order.client}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
