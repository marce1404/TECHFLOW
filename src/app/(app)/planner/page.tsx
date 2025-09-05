
'use client';

import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { PlannerCalendar } from '@/components/planner/planner-calendar';
import { ScheduleDialog } from '@/components/planner/schedule-dialog';
import type { WorkOrder } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';

export default function PlannerPage() {
    const { workOrders, loading, updateOrder } = useWorkOrders();
    const { userProfile } = useAuth();
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [isScheduling, setIsScheduling] = React.useState(false);
    
    const canSchedule = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

    const handleDayClick = (day: Date) => {
        if (!canSchedule) return;
        setSelectedDate(day);
        setIsScheduling(true);
    };
    
    const handleScheduleSubmit = async (otId: string, startTime: string, endTime: string, date: Date, endDate?: Date) => {
        const orderToUpdate = workOrders.find(ot => ot.id === otId);
        if (orderToUpdate) {
            const dataToUpdate: Partial<WorkOrder> = {
                ...orderToUpdate,
                date: format(date, 'yyyy-MM-dd'),
                startTime, 
                endTime 
            };

            if (endDate) {
                dataToUpdate.endDate = format(endDate, 'yyyy-MM-dd');
            } else {
                // Ensure we don't send undefined. If no end date, don't include the field.
                delete dataToUpdate.endDate;
            }
            
            await updateOrder(otId, dataToUpdate);
        }
        setIsScheduling(false);
    };


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
            <PlannerCalendar 
                workOrders={workOrders} 
                onDayClick={handleDayClick} 
                canSchedule={canSchedule}
            />
            {canSchedule && (
                 <ScheduleDialog
                    open={isScheduling}
                    onOpenChange={setIsScheduling}
                    date={selectedDate}
                    workOrders={workOrders.filter(ot => ot.status === 'Por Iniciar' || ot.status === 'Pendiente')}
                    onSchedule={handleScheduleSubmit}
                />
            )}
        </div>
    );
}
