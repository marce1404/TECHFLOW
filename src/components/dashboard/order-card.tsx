
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

interface OrderCardProps {
  order: WorkOrder;
  progress: number;
}

export function OrderCard({ order, progress }: OrderCardProps) {
  const getStatusVariant = (status: WorkOrder['status']) => {
    switch (status) {
      case 'En Progreso':
        return 'secondary';
      case 'Atrasada':
        return 'destructive';
      case 'Por Iniciar':
        return 'outline';
      case 'Pendiente':
        return 'default';
      default:
        return 'default';
    }
  };
  
  const getPriorityVariant = (priority: WorkOrder['priority']) => {
    switch (priority) {
      case 'Alta':
        return 'destructive';
      case 'Media':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getChartColor = (status: WorkOrder['status']) => {
     switch (status) {
      case 'Atrasada':
        return 'hsl(var(--chart-5))'; // Red
      case 'En Progreso':
        return 'hsl(var(--chart-2))'; // Yellow
      case 'Por Iniciar':
         return 'hsl(var(--chart-1))'; // Blue
      default:
        return 'hsl(var(--muted))'; // Gray for others
    }
  }

  const chartData: DonutChartData[] = [
      { name: 'progress', value: progress, fill: getChartColor(order.status) }
  ];


  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardDescription>{order.ot_number} - {order.client}</CardDescription>
            <CardTitle className="text-lg font-bold leading-tight mt-1 truncate">{order.description}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
             <Badge variant={getPriorityVariant(order.priority)} className="capitalize text-xs">{order.priority}</Badge>
             <Badge variant={getStatusVariant(order.status)} className="capitalize text-xs">{order.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground flex-1 space-y-1">
            <p className="font-semibold text-foreground">{order.service}</p>
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{order.assigned.join(', ')}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{order.date}</span>
            </div>
          </div>
          <div className="h-24 w-24">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={28}
                  strokeWidth={5}
                  label={({payload}) => {
                      return <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-lg font-bold">{`${payload.value}%`}</text>
                  }}
                  labelLine={false}
                >
                    <Cell 
                        key={chartData[0].name} 
                        fill={chartData[0].fill}
                        radius={[8, 8, 8, 8]}
                     />
                     <Cell 
                        key="background" 
                        fill="hsl(var(--muted))" 
                        opacity={0.3}
                        radius={[8, 8, 8, 8]}
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
