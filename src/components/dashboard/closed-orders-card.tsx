

'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WorkOrder } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Archive } from 'lucide-react';

interface ClosedOrdersCardProps {
  orders: WorkOrder[];
}

export function ClosedOrdersCard({ orders }: ClosedOrdersCardProps) {
  return (
    <Card className="flex flex-col bg-secondary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">OTs Finalizadas del Mes</CardTitle>
            <CardDescription>Resumen de OTs completadas.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <p className="text-3xl font-bold text-primary">{orders.length}</p>
             <Archive className="h-8 w-8 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {orders.length > 0 ? (
          <ScrollArea className="h-48 pr-4">
            <div className="space-y-2">
              {orders.map((order) => (
                 <div key={order.id} className="text-xs p-2 bg-background/50 rounded-md border">
                    <p className="font-semibold truncate">{order.description}</p>
                    <p className="text-muted-foreground">{order.ot_number} - {order.client}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              Aún no se han finalizado OTs este mes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
