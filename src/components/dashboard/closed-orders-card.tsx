
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

interface ClosedOrdersCardProps {
  orders: WorkOrder[];
}

export function ClosedOrdersCard({ orders }: ClosedOrdersCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold leading-tight">OT Cerradas del Mes</CardTitle>
        <CardDescription>Resumen de OTs completadas</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <ScrollArea className="h-48">
            <div className="flex flex-wrap gap-2">
              {orders.map((order) => (
                <Badge key={order.id} variant="secondary" className="text-sm">
                  {order.ot_number}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-48 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no se han cerrado OTs este mes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
