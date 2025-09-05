
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


interface PlannerCalendarProps {
  workOrders: WorkOrder[];
}

type ViewType = 'month' | 'week';

export function PlannerCalendar({ workOrders }: PlannerCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<ViewType>('month');

  const firstDayOfCurrentPeriod = view === 'month' 
    ? startOfMonth(currentDate) 
    : startOfWeek(currentDate, { locale: es });
  
  const lastDayOfCurrentPeriod = view === 'month'
    ? endOfMonth(currentDate)
    : endOfWeek(currentDate, { locale: es });

  const daysToShow = eachDayOfInterval({
    start: startOfWeek(firstDayOfCurrentPeriod, { locale: es }),
    end: endOfWeek(lastDayOfCurrentPeriod, { locale: es }),
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

  const handlePrevious = () => {
    const newDate = add(currentDate, view === 'month' ? { months: -1 } : { weeks: -1 });
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = add(currentDate, view === 'month' ? { months: 1 } : { weeks: 1 });
    setCurrentDate(newDate);
  };

  const getHeaderText = () => {
    if (view === 'month') {
        return format(currentDate, 'MMMM yyyy', { locale: es });
    }
    const start = startOfWeek(currentDate, { locale: es });
    const end = endOfWeek(currentDate, { locale: es });
    if (isSameMonth(start, end)) {
        return format(start, 'MMMM yyyy', { locale: es });
    }
    return `${format(start, 'MMM', { locale: es })} - ${format(end, 'MMM yyyy', { locale: es })}`;
  }
  
  const daysInWeek = 7;
  const numWeeks = view === 'month' ? Math.ceil(daysToShow.length / daysInWeek) : 1;


  return (
    <div className="bg-card text-card-foreground rounded-xl border shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold capitalize font-headline">
          {getHeaderText()}
        </h2>
        <div className="flex items-center gap-4">
             <ToggleGroup type="single" value={view} onValueChange={(value: ViewType) => value && setView(value)}>
                <ToggleGroupItem value="month">Mes</ToggleGroupItem>
                <ToggleGroupItem value="week">Semana</ToggleGroupItem>
            </ToggleGroup>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </div>
      <div className="grid grid-cols-7">
        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground border-b border-r">
            {day}
          </div>
        ))}
      </div>
      <div 
        className={cn("grid grid-cols-7", view === 'week' ? 'h-[calc(100vh-20rem)]' : `grid-rows-${numWeeks}`)}
        style={{ gridTemplateRows: view === 'month' ? `repeat(${numWeeks}, minmax(0, 1fr))` : '1fr' }}
       >
        {(view === 'month' ? daysToShow : daysToShow.slice(0, 7)).map((day) => {
          const ordersForDay = workOrders.filter((order) =>
            isSameDay(parseISO(order.date), day)
          );

          return (
            <div
              key={day.toString()}
              className={cn(
                'border-b border-r p-2 flex flex-col',
                isSameMonth(day, currentDate) ? 'bg-card' : 'bg-muted/50',
                view === 'month' && 'min-h-[120px]',
                view === 'week' && 'h-full'
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
