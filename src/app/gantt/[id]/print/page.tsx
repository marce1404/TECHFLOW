
'use client';
import { getGanttForPrint } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GanttChart, GanttTask } from '@/lib/types';
import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import * as React from 'react';
import { useParams } from 'next/navigation';

function PrintGanttPageContent({ ganttChart }: { ganttChart: GanttChart }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    React.useEffect(() => {
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    const calculateWorkingDays = (startDate: Date, endDate: Date, workOnSaturdays: boolean, workOnSundays: boolean): number => {
        let count = 0;
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay(); // Sunday is 0, Saturday is 6
            if (dayOfWeek === 0 && !workOnSundays) {
                // It's Sunday and we don't work on Sundays
            } else if (dayOfWeek === 6 && !workOnSaturdays) {
                // It's Saturday and we don't work on Saturdays
            } else {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
    };
    
    const calculateEndDate = (startDate: Date, duration: number, workOnSaturdays: boolean, workOnSundays: boolean): Date => {
        if (duration === 0) return startDate;
        let remainingDays = duration;
        let currentDate = new Date(startDate);
        if (duration > 0) {
            currentDate.setDate(currentDate.getDate() - 1);
        }
    
        while (remainingDays > 0) {
            currentDate = addDays(currentDate, 1);
            const dayOfWeek = currentDate.getDay();
            const isSaturday = dayOfWeek === 6;
            const isSunday = dayOfWeek === 0;
    
            if ((!isSaturday || workOnSaturdays) && (!isSunday || workOnSundays)) {
                remainingDays--;
            }
        }
        return currentDate;
    };

    const ganttChartData = React.useMemo(() => {
        if (!ganttChart.tasks || ganttChart.tasks.length === 0) {
            return { days: [], months: [], earliestDate: null, latestDate: null };
        }

        const validTasks = ganttChart.tasks.filter(t => t.startDate && t.duration > 0 && !t.isPhase);
        if (validTasks.length === 0) {
            return { days: [], months: [], earliestDate: null, latestDate: null };
        }
        
        const earliestDate = new Date(Math.min(...validTasks.map(t => new Date(t.startDate).getTime())));
        const latestDate = new Date(Math.max(...validTasks.map(t => calculateEndDate(new Date(t.startDate), t.duration, ganttChart.workOnSaturdays, ganttChart.workOnSundays).getTime())));

        if (isNaN(earliestDate.getTime()) || isNaN(latestDate.getTime())) {
            return { days: [], months: [], earliestDate: null, latestDate: null };
        }

        const days = eachDayOfInterval({ start: earliestDate, end: latestDate });

        const months = days.reduce((acc, day) => {
            const month = format(day, 'MMMM yyyy', { locale: es });
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month]++;
            return acc;
        }, {} as Record<string, number>);

        return { days, months: Object.entries(months), earliestDate, latestDate };
    }, [ganttChart]);

    const getProgressColor = (task: GanttTask, endDate: Date) => {
        const progress = task.progress || 0;
        const startDate = new Date(task.startDate);

        if (progress >= 100) {
            return 'bg-blue-500'; // Completed
        }
        if (isPast(endDate) && progress < 100) {
            return 'bg-red-500'; // Late
        }
        if ((isPast(startDate) || isToday(startDate)) && !isPast(endDate)) {
            const totalWorkingDays = calculateWorkingDays(startDate, endDate, ganttChart.workOnSaturdays, ganttChart.workOnSundays);
            if (totalWorkingDays === 0) return 'bg-green-500';

            const elapsedWorkingDays = calculateWorkingDays(startDate, today, ganttChart.workOnSaturdays, ganttChart.workOnSundays);
            const expectedProgress = Math.min(Math.round((elapsedWorkingDays / totalWorkingDays) * 100), 100);

            return progress < expectedProgress ? 'bg-red-500' : 'bg-green-500'; // Behind or On-schedule
        }
        return 'bg-green-500'; // Not started yet, but on track
    }

    return (
        <div className="bg-white text-black p-8">
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">{ganttChart.name}</CardTitle>
                    <CardDescription>OT Asociada: {ganttChart.assignedOT || 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    {ganttChart.tasks.length > 0 && ganttChartData.days.length > 0 && ganttChartData.earliestDate && ganttChartData.latestDate ? (
                        <div className="min-w-full text-xs">
                            <div className="grid" style={{ gridTemplateColumns: `12rem repeat(${ganttChartData.days.length}, minmax(1.5rem, 1fr))` }}>
                                {/* Month Header */}
                                <div className="sticky left-0 z-10 bg-white border-b border-r font-semibold"></div>
                                {ganttChartData.months.map(([month, dayCount]) => (
                                    <div key={month} className="text-center font-semibold capitalize border-b border-r" style={{ gridColumn: `span ${dayCount}` }}>
                                        {month}
                                    </div>
                                ))}

                                {/* Day Header */}
                                <div className="sticky left-0 z-10 bg-white border-b border-r font-semibold"></div>
                                {ganttChartData.days.map((day) => (
                                    <div key={day.toString()} className="text-center font-semibold border-b border-r h-6 flex items-center justify-center">
                                        {format(day, 'd')}
                                    </div>
                                ))}

                                {/* Task Rows & Bars */}
                                {ganttChart.tasks.map((task, index) => {
                                    const gridRowStart = index + 3;
                                    
                                    if (task.isPhase) {
                                        return (
                                            <React.Fragment key={task.id}>
                                                <div className="sticky left-0 bg-gray-100 z-10 truncate pr-2 py-1 border-b border-r flex items-center font-bold" style={{ gridRow: gridRowStart, gridColumn: `1 / span ${ganttChartData.days.length + 1}` }}>
                                                    {task.name}
                                                </div>
                                            </React.Fragment>
                                        )
                                    }

                                    if (!task.startDate || !task.duration || !ganttChartData.earliestDate) {
                                        return null;
                                    }

                                    const startDate = new Date(task.startDate);
                                    const endDate = calculateEndDate(startDate, task.duration, ganttChart.workOnSaturdays, ganttChart.workOnSundays);
                                    const offset = differenceInCalendarDays(startDate, ganttChartData.earliestDate);
                                    const durationInDays = differenceInCalendarDays(endDate, startDate) + 1;
                                    
                                    const progressColor = getProgressColor(task, endDate);

                                    return (
                                        <React.Fragment key={task.id}>
                                            <div className="sticky left-0 bg-white z-10 truncate pr-2 py-1 border-b border-r flex items-center" style={{ gridRow: gridRowStart, gridColumnStart: 1, gridColumnEnd: 2 }}>
                                                {task.name}
                                            </div>
                                            
                                            {ganttChartData.days.map((_, dayIndex) => (
                                                <div key={dayIndex} className="border-b border-r h-8" style={{ gridRow: gridRowStart, gridColumn: dayIndex + 2 }}></div>
                                            ))}
                                            
                                            {task.duration > 0 && offset >= 0 && (
                                                <div
                                                    className="absolute h-5 top-1.5 rounded bg-gray-200"
                                                    style={{ 
                                                        gridRow: gridRowStart,
                                                        gridColumn: `${offset + 2} / span ${durationInDays}`,
                                                    }}
                                                    title={`${task.name} - ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`}
                                                >
                                                    <div 
                                                        className={cn("h-full rounded text-white text-[10px] flex items-center justify-end pr-1", progressColor)}
                                                        style={{
                                                            width: `${task.progress || 0}%`,
                                                        }}
                                                    >
                                                      <span>{task.progress || 0}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center p-8">
                            No hay tareas para mostrar en el gráfico.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function PrintGanttPage() {
    const params = useParams();
    const ganttId = params.id as string;
    const [ganttChart, setGanttChart] = React.useState<GanttChart | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        if (!ganttId) {
            setError('ID de Gantt no válido.');
            setLoading(false);
            return;
        }
        
        async function fetchGantt() {
            try {
                const chart = await getGanttForPrint(ganttId);
                if (chart) {
                    setGanttChart(chart);
                } else {
                    setError('No se pudo encontrar la Carta Gantt.');
                }
            } catch (err) {
                setError('Ocurrió un error al cargar los datos.');
            } finally {
                setLoading(false);
            }
        }
        fetchGantt();
    }, [ganttId]);

    if (loading) {
        return <div className="p-8 text-center">Cargando para imprimir...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!ganttChart) {
        return <div className="p-8 text-center">No hay datos de Carta Gantt.</div>;
    }

    return <PrintGanttPageContent ganttChart={ganttChart} />;
}
