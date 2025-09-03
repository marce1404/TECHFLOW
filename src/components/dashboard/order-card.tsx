

'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { DonutChart } from 'recharts';
import { Pie, PieChart, Cell } from 'recharts';
import type { WorkOrder, DonutChartData, DonutChartConfig } from '@/lib/types';
import { DonutChartConfig as chartConfig } from '@/lib/types';
import { Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { normalizeString } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: WorkOrder;
  progress: number;
}

export function OrderCard({ order, progress }: OrderCardProps) {
  const getStatusVariant = (status: WorkOrder['status']) => {
    switch (normalizeString(status)) {
      case 'atrasada':
        return 'destructive';
      case 'por iniciar':
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

  
  const getChartColor = (status: WorkOrder['status']) => {
    const normalizedStatus = normalizeString(status);
    if (normalizedStatus === 'en proceso') {
        return 'hsl(142, 71%, 45%)'; // Green
    }
    if (normalizedStatus === 'atrasada') {
        return 'hsl(var(--destructive))'; // Red
    }
    return 'hsl(var(--muted))'; // Gray for all other cases
  }


  return (
    <Card className="flex flex-col relative">
      <Link href={`/orders/${order.id}/edit`} className="absolute inset-0 z-10"><span className="sr-only">Ver detalles de la orden</span></Link>
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardDescription className="text-xs">{order.ot_number} - {order.client}</CardDescription>
            <CardTitle className="text-base font-bold leading-tight mt-1 truncate">{order.description}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground truncate">{order.service}</p>
                <Badge 
                    variant={getStatusVariant(order.status)} 
                    className={cn(getStatusBadgeClass(order.status), 'text-[10px] px-2 py-0.5')}
                >
                    {order.status.toUpperCase()}
                </Badge>
            </div>
            <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{order.assigned.join(', ')}</span>
            </div>
             <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{order.date}</span>
            </div>
          </div>
          <div className="h-20 w-20 flex-shrink-0">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={[{ value: progress }, { value: 100 - progress }]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={22}
                  strokeWidth={4}
                  startAngle={90}
                  endAngle={450}
                  label={({payload}) => {
                      return <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-base font-bold">{`${progress}%`}</text>
                  }}
                  labelLine={false}
                >
                    <Cell 
                        key="progress" 
                        fill={getChartColor(order.status)}
                        radius={[6, 6, 6, 6]}
                     />
                     <Cell 
                        key="background" 
                        fill="hsl(var(--muted))" 
                        opacity={0.3}
                        radius={[6, 6, 6, 6]}
                     />
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
