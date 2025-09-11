
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
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkOrder } from '@/lib/types';
import { cn, normalizeString } from '@/lib/utils';
import Link from 'next/link';
import { useWorkOrders } from '@/context/work-orders-context';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"


interface PlannerCalendarProps {
  workOrders: WorkOrder[];
  onDayClick: (day: Date) => void;
  canSchedule: boolean;
}

type ViewType = 'month' | 'week';

export function PlannerCalendar({ workOrders, onDayClick, canSchedule }: PlannerCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [view, setView] = React.useState<ViewType>('month');
  const { updateOrder } = useWorkOrders();

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
       case 'actividad':
        return 'bg-purple-500/80 border-purple-600';
      default:
        return 'bg-secondary border-border';
    }
  };
  
  const getEventsForDay = React.useCallback((day: Date) => {
    return workOrders
      .filter(order => {
        if (!order.date) return false;
        // The date from firestore might be a string, so we parse it.
        // Adding replace to handle both '2024-01-01' and '2024/01/01'
        const startDate = startOfDay(new Date(order.date.replace(/-/g, '/')));
        // If endDate is missing or empty, use startDate. Ensure end of day for interval checks.
        const endDate = order.endDate 
            ? endOfDay(new Date(order.endDate.replace(/-/g, '/')))
            : endOfDay(startDate);

        return isWithinInterval(day, { start: startDate, end: endDate });
      })
      .sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
  }, [workOrders]);

  const handlePrevious = () => {
    const newDate = add(currentDate, view === 'month' ? { months: -1 } : { weeks: -1 });
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = add(currentDate, view === 'month' ? { months: 1 } : { weeks: 1 });
    setCurrentDate(newDate);
  };
  
  const handleUnschedule = async (orderId: string) => {
    const orderToUpdate = workOrders.find(ot => ot.id === orderId);
    if (orderToUpdate) {
      if (orderToUpdate.isActivity) {
        // This should probably be a delete operation for activities
      } else {
         const dataToUpdate: Partial<WorkOrder> = {
          ...orderToUpdate,
          date: '',
          endDate: '',
          startTime: '',
          endTime: '',
          status: 'Por Iniciar'
        };
        await updateOrder(orderId, dataToUpdate);
      }
    }
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
  
    const daysInPeriod = view === 'month' ? daysToShow : daysToShow.slice(0, 7);


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
       <div className="grid grid-cols-7 relative">
            {daysInPeriod.map((day) => (
                <div
                    key={day.toString()}
                    onClick={() => onDayClick(day)}
                    className={cn(
                        'border-b border-r p-1 flex flex-col space-y-1',
                        isSameMonth(day, currentDate) ? 'bg-card' : 'bg-muted/50',
                        view === 'month' ? 'min-h-[120px]' : 'h-[calc(100vh-20rem)]',
                        canSchedule && 'cursor-pointer hover:bg-muted/70 transition-colors'
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
                    <div className="flex-1 space-y-1 overflow-y-auto">
                        {getEventsForDay(day).map(order => (
                            <div key={order.id} className="relative group w-full">
                                <Link href={`/orders/${order.id}/edit`}>
                                    <div
                                        className={cn(
                                        'text-xs rounded-md p-1 text-white hover:opacity-80 transition-opacity w-full',
                                        getStatusColorClass(order.status)
                                        )}
                                    >
                                        {order.startTime && <span className="font-bold">{order.startTime}</span>}
                                        <p className="font-semibold truncate">{order.isActivity ? order.activityName : order.ot_number}</p>
                                        <p className="truncate text-white/90">{order.client}</p>
                                    </div>
                                </Link>
                                {canSchedule && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="absolute top-0 right-0 h-4 w-4 p-0.5 rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <XIcon className="h-3 w-3" />
                                            <span className="sr-only">Desprogramar</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Desprogramar esta OT?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción quitará la OT <span className="font-bold">{order.ot_number}</span> del calendario y la marcará como "Por Iniciar". No se eliminará la OT.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleUnschedule(order.id)}>Sí, desprogramar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}
