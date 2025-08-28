
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
    switch (status.toLowerCase()) {
      case 'atrasada':
        return 'destructive';
      case 'cerrada':
        return 'default';
      case 'por iniciar':
        return 'outline';
      case 'pendiente':
        return 'secondary';
      case 'en progreso':
        return 'default'; // Using default for a custom color background
      default:
        return 'default';
    }
  };
  
  const getChartColor = (status: WorkOrder['status']) => {
     switch (status.toLowerCase()) {
      case 'atrasada':
        return 'hsl(var(--destructive))'; // Red
      case 'en progreso':
        return 'hsl(142, 71%, 45%)'; // Green
      case 'por iniciar':
         return 'hsl(var(--muted))'; // Gray
      case 'pendiente':
         return 'hsl(var(--secondary-foreground))';
      default:
        return 'hsl(var(--muted))'; // Gray for others
    }
  }
  
  const statusBadgeStyle = order.status.toLowerCase() === 'en progreso' ? { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' } : {};


  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardDescription>{order.ot_number} - {order.client}</CardDescription>
            <CardTitle className="text-lg font-bold leading-tight mt-1 truncate">{order.description}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground truncate">{order.service}</p>
                <Badge variant={getStatusVariant(order.status)} style={statusBadgeStyle} className="capitalize text-xs">{order.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{order.assigned.join(', ')}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{order.date}</span>
            </div>
          </div>
          <div className="h-24 w-24 flex-shrink-0">
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
                  innerRadius={28}
                  strokeWidth={5}
                  startAngle={90}
                  endAngle={450}
                  label={({payload}) => {
                      return <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-lg font-bold">{`${progress}%`}</text>
                  }}
                  labelLine={false}
                >
                    <Cell 
                        key="progress" 
                        fill={getChartColor(order.status)}
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
