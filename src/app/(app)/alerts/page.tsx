
'use client';

import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AlertsTable, { type ExpirationAlertItem } from './alerts-table';
import { differenceInDays, parseISO, addYears } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';

export default function AlertsPage() {
    const { collaborators, loading: workOrdersLoading } = useWorkOrders();
    const { loading: authLoading } = useAuth();
    const loading = workOrdersLoading || authLoading;

    const allExpiringItems = React.useMemo(() => {
        if (loading) return [];
        
        const alerts: ExpirationAlertItem[] = [];
        const today = new Date();
        
        collaborators.forEach(c => {
            const allItems = [
                ...(c.workClothing || []),
                ...(c.epp || []),
                ...(c.certifications || []),
            ];

            allItems.forEach(item => {
                if (!item) return;
                
                let expiration: Date | null = null;
                let expirationDateStr: string | undefined = undefined;

                if ('expirationDate' in item && item.expirationDate) {
                    expiration = parseISO(item.expirationDate);
                    expirationDateStr = item.expirationDate;
                } else if ('deliveryDate' in item && item.deliveryDate) {
                    expiration = addYears(parseISO(item.deliveryDate), 1);
                    expirationDateStr = expiration.toISOString().split('T')[0];
                } else if ('issueDate' in item && item.issueDate) {
                    expiration = addYears(parseISO(item.issueDate), 1);
                    expirationDateStr = expiration.toISOString().split('T')[0];
                }

                if (expiration && expirationDateStr) {
                    const daysUntilExpiration = differenceInDays(expiration, today);
                     alerts.push({
                        collaboratorId: c.id,
                        collaboratorName: c.name,
                        itemName: ('item' in item ? item.item : item.name) || 'Documento sin nombre',
                        daysUntilExpiration,
                        expirationDate: expirationDateStr,
                    });
                }
            });
        });

        return alerts.sort((a,b) => a.daysUntilExpiration - b.daysUntilExpiration);
    }, [collaborators, loading]);

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Alertas de Vencimiento</CardTitle>
                    <CardDescription>
                        Listado completo de EPP, ropa de trabajo y certificaciones vencidas o por vencer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                           {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <AlertsTable items={allExpiringItems} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
