
'use client';

import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { PlannerCalendar } from '@/components/planner/planner-calendar';
import { ScheduleDialog } from '@/components/planner/schedule-dialog';
import type { Collaborator, WorkOrder } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { normalizeString } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { sendActivityEmailAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { es } from 'date-fns/locale';

export type ScheduleFormValues = {
    workOrderId?: string;
    activityName?: string;
    startDate: Date;
    endDate?: Date;
    startTime: string;
    endTime: string;
    assigned?: string[];
    technicians?: string[];
}

export default function PlannerPage() {
    const { workOrders, loading, updateOrder, addOrder, smtpConfig, collaborators } = useWorkOrders();
    const { userProfile } = useAuth();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [isScheduling, setIsScheduling] = React.useState(false);
    
    const canSchedule = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

    const handleDayClick = (day: Date) => {
        if (!canSchedule) return;
        setSelectedDate(day);
        setIsScheduling(true);
    };
    
    const handleScheduleSubmit = async (data: ScheduleFormValues) => {
        const { workOrderId, activityName, startDate, endDate, startTime, endTime, assigned, technicians } = data;

        if (workOrderId) {
            const orderToUpdate = workOrders.find(ot => ot.id === workOrderId);
            if (orderToUpdate) {
                const dataToUpdate: Partial<WorkOrder> = {
                    ...orderToUpdate,
                    date: format(startDate, 'yyyy-MM-dd'),
                    startTime, 
                    endTime,
                    status: 'En Progreso',
                    assigned,
                    technicians,
                };

                if (endDate) {
                    dataToUpdate.endDate = format(endDate, 'yyyy-MM-dd');
                } else {
                    dataToUpdate.endDate = format(startDate, 'yyyy-MM-dd');
                }
                
                await updateOrder(workOrderId, dataToUpdate);
            }
        } else if (activityName) {
            const finalEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd');

            const newActivity: Omit<WorkOrder, 'id'> = {
                ot_number: `ACTIVIDAD-${uuidv4().substring(0,4).toUpperCase()}`,
                description: activityName,
                activityName: activityName,
                isActivity: true,
                client: userProfile?.displayName || 'Interno',
                service: 'Actividad',
                date: format(startDate, 'yyyy-MM-dd'),
                endDate: finalEndDate,
                startTime,
                endTime,
                status: 'Actividad',
                priority: 'Baja',
                assigned: assigned || [],
                technicians: technicians || [],
                vehicles: [],
                comercial: '',
                netPrice: 0,
                createdAt: format(new Date(), 'yyyy-MM-dd'),
            };
            const savedActivity = await addOrder(newActivity);
            
             // Send email notification
            if (smtpConfig) {
                const getEmailsFromNames = (names: string[]): string[] => {
                    return names
                        .map(name => collaborators.find(c => c.name === name)?.email)
                        .filter((email): email is string => !!email);
                };

                const toEmails = Array.from(new Set([
                    ...(userProfile?.email ? [userProfile.email] : []),
                    ...getEmailsFromNames(assigned || []),
                    ...getEmailsFromNames(technicians || []),
                ]));
                
                if (toEmails.length > 0) {
                   const emailData = {
                        activityName: newActivity.description,
                        startDate: format(startDate, "EEEE, d 'de' MMMM, yyyy", { locale: es }),
                        startTime: newActivity.startTime || '',
                        endTime: newActivity.endTime || '',
                        organizer: userProfile?.displayName || 'N/A',
                        assigned: newActivity.assigned?.join(', ') || 'N/A',
                        technicians: newActivity.technicians?.join(', ') || 'N/A',
                    };

                    await sendActivityEmailAction(toEmails, emailData, smtpConfig);
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Advertencia',
                    description: 'Actividad creada, pero no se pudo enviar la notificación por correo. La configuración SMTP no está establecida.'
                });
            }
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
                    workOrders={workOrders.filter(ot => normalizeString(ot.status) !== 'cerrada')}
                    onSchedule={handleScheduleSubmit}
                />
            )}
        </div>
    );
}
