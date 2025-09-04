
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export type ExpirationAlertItem = {
    collaboratorName: string;
    itemName: string;
    daysUntilExpiration: number;
    expirationDate: string;
};

interface ExpirationAlertsCardProps {
  items: ExpirationAlertItem[];
}

export function ExpirationAlertsCard({ items }: ExpirationAlertsCardProps) {
  const getBadgeColor = (days: number) => {
    if (days <= 7) return 'bg-destructive/80 text-destructive-foreground';
    if (days <= 30) return 'bg-yellow-500 text-black';
    return 'bg-secondary text-secondary-foreground';
  }

  return (
    <Card className="flex flex-col bg-secondary/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Alertas de Vencimiento</CardTitle>
            <CardDescription>EPP y documentos por vencer.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
             <p className="text-3xl font-bold text-destructive">{items.length}</p>
             <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {items.length > 0 ? (
          <ScrollArea className="h-48 pr-4">
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="text-xs p-2 bg-background/50 rounded-md border flex justify-between items-center">
                    <div>
                        <p className="font-semibold truncate">{item.itemName}</p>
                        <p className="text-muted-foreground">{item.collaboratorName}</p>
                        <div className="flex items-center gap-1 text-muted-foreground/80 mt-1">
                            <CalendarDays className="h-3 w-3"/>
                            <span>Vence el: {format(parseISO(item.expirationDate), 'dd/MM/yyyy', {locale: es})}</span>
                        </div>
                    </div>
                     <div className={cn("flex-shrink-0 text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center", getBadgeColor(item.daysUntilExpiration))}>
                        {item.daysUntilExpiration}d
                     </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full text-center">
            <p className="text-sm text-muted-foreground">
              No hay vencimientos en los próximos 60 días.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
