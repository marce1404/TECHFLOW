
'use client';

import * as React from 'react';
import type { WorkOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ClosedOrdersSummaryProps {
  orders: WorkOrder[];
}

export function ClosedOrdersSummary({ orders }: ClosedOrdersSummaryProps) {
  const groupedOrders = React.useMemo(() => {
    return orders.reduce((acc, order) => {
      const prefix = order.ot_number.split('-')[0];
      if (!acc[prefix]) {
        acc[prefix] = [];
      }
      acc[prefix].push(order);
      return acc;
    }, {} as Record<string, WorkOrder[]>);
  }, [orders]);

  const prefixes = Object.keys(groupedOrders).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">OT Cerradas del Mes</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4 text-sm">
                {prefixes.map((prefix, index) => (
                    <div key={prefix} className="flex gap-x-8">
                        <div className="flex-1">
                            <h3 className="font-semibold text-base mb-2">{prefix}</h3>
                            <ul className="space-y-1">
                            {groupedOrders[prefix].slice(0, 5).map(order => (
                                <li key={order.id} className="text-muted-foreground flex justify-between">
                                <span className="font-medium text-foreground mr-2">{order.ot_number}</span>
                                <span className="truncate">{order.description}</span>
                                </li>
                            ))}
                            </ul>
                        </div>
                        {index < prefixes.length - 1 && (
                            <Separator orientation="vertical" className="hidden lg:block"/>
                        )}
                    </div>
                ))}
            </div>
        ) : (
          <p className="text-muted-foreground">No hay órdenes de trabajo cerradas este mes.</p>
        )}
      </CardContent>
    </Card>
  );
}

