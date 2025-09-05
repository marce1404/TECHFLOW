
'use client';

import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { PlannerCalendar } from '@/components/planner/planner-calendar';

export default function PlannerPage() {
    const { workOrders, loading } = useWorkOrders();

    if (loading) {
        return <div>Cargando planificador...</div>;
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="text-3xl font-headline font-bold tracking-tight">Planificador de Órdenes de Trabajo</h1>
                    <p className="text-muted-foreground">
                        Visualiza, organiza y planifica tus OTs en un calendario mensual.
                    </p>
                </div>
            </div>
            <PlannerCalendar workOrders={workOrders} />
        </div>
    );
}
