

'use client';

import * as React from 'react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn, normalizeString } from '@/lib/utils';
import type { WorkOrder } from '@/lib/types';
import Link from 'next/link';
import { useWorkOrders } from '@/context/work-orders-context';
import { Badge } from '../ui/badge';
import { Calendar } from '@/components/ui/calendar';

interface AssignmentHistoryProps {
  title: string;
  description: string;
  filterKey: 'technician' | 'supervisor' | 'vehicle';
  filterValue: string;
}

export default function AssignmentHistory({ title, description, filterKey, filterValue }: AssignmentHistoryProps) {
  const { activeWorkOrders, historicalWorkOrders } = useWorkOrders();
  const allWorkOrders = [...activeWorkOrders, ...historicalWorkOrders];

  const [date, setDate] = React.useState<DateRange | undefined>();

  const getStatusVariant = (
    status: WorkOrder['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (normalizeString(status)) {
      case 'atrasada':
        return 'destructive';
      case 'cerrada':
        return 'default';
      case 'suspendida':
      case 'pendiente':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getStatusBadgeClass = (status: WorkOrder['status']) => {
    const normalizedStatus = normalizeString(status);
    if (normalizedStatus === 'en proceso') {
      return 'bg-green-500 text-white border-transparent';
    }
    if (normalizedStatus === 'por iniciar') {
      return 'bg-primary text-primary-foreground border-transparent'
    }
    if (normalizedStatus === 'cerrada') {
      return 'bg-background text-foreground'
    }
    return '';
  };

  const filteredOrders = React.useMemo(() => {
    let orders = allWorkOrders.filter(order => {
        const valueToFilter = filterValue;
        if (!valueToFilter) return false;

        if (filterKey === 'vehicle') {
            return order.vehicles?.includes(valueToFilter);
        }
        
        // For collaborators, check both technicians and assigned supervisors
        return order.technicians?.includes(valueToFilter) || order.assigned?.includes(valueToFilter);
    });

    if (date?.from) {
      orders = orders.filter(order => {
        const orderDate = new Date(order.date.replace(/-/g, '/'));
        return orderDate >= date.from!;
      });
    }
    if (date?.to) {
        orders = orders.filter(order => {
          const orderDate = new Date(order.date.replace(/-/g, '/'));
          return orderDate <= date.to!;
        });
      }

    return orders.sort((a, b) => new Date(b.date.replace(/-/g, '/')).getTime() - new Date(a.date.replace(/-/g, '/')).getTime());

  }, [allWorkOrders, date, filterKey, filterValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "dd/MM/yyyy", {locale: es})} -{" "}
                      {format(date.to, "dd/MM/yyyy", {locale: es})}
                    </>
                  ) : (
                    format(date.from, "dd/MM/yyyy", {locale: es})
                  )
                ) : (
                  <span>Seleccionar rango de fechas</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={es}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => setDate(undefined)}>Limpiar</Button>
        </div>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>OT</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell>
                                    <Link href={`/orders/${order.id}/edit`} className="text-primary hover:underline">
                                        {order.ot_number}
                                    </Link>
                                </TableCell>
                                <TableCell>{order.description}</TableCell>
                                <TableCell>{format(new Date(order.date.replace(/-/g, '/')), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={getStatusVariant(order.status)}
                                        className={getStatusBadgeClass(order.status)}
                                    >
                                        {order.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No se encontraron órdenes de trabajo para este filtro.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
