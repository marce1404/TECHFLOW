
'use client';
import { getGanttForPrint } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GanttChart } from '@/lib/types';
import { addDays, differenceInCalendarDays, eachDayOfInterval, format } from 'date-fns';
import * as React from 'react';

function PrintGanttPageContent({ ganttChart }: { ganttChart: GanttChart }) {
    const colorPalette = [
        '#3CA7FA', '#F9A825', '#27AE60', '#EB5757', '#BB6BD9', 
        '#FF7F50', '#00CED1', '#FFD700', '#4682B4', '#4F4F4F'
    ];

    React.useEffect(() => {
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

    const calculateEndDate = (startDate: Date, duration: number, workOnSaturdays: boolean, workOnSundays: boolean) => {
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

        const validTasks = ganttChart.tasks.filter(t => t.startDate && t.duration > 0);
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
            const month = format(day, 'MMMM yyyy');
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month]++;
            return acc;
        }, {} as Record<string, number>);

        return { days, months: Object.entries(months), earliestDate, latestDate };
    }, [ganttChart]);

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
                                    if (!task.startDate || !task.duration || !ganttChartData.earliestDate) {
                                        return null;
                                    }
                                    const startDate = new Date(task.startDate);
                                    const endDate = calculateEndDate(startDate, task.duration, ganttChart.workOnSaturdays, ganttChart.workOnSundays);
                                    const offset = differenceInCalendarDays(startDate, ganttChartData.earliestDate);
                                    
                                    const gridRowStart = index + 3;

                                    return (
                                        <React.Fragment key={task.id}>
                                            <div className="sticky left-0 bg-white z-10 truncate pr-2 py-1 border-b border-r flex items-center" style={{ gridRow: gridRowStart, gridColumnStart: 1, gridColumnEnd: 2 }}>
                                                {task.name}
                                            </div>
                                            
                                            {ganttChartData.days.map((_, dayIndex) => (
                                                <div key={dayIndex} className="border-b border-r h-8" style={{ gridRow: gridRowStart, gridColumn: dayIndex + 2 }}></div>
                                            ))}
                                            
                                            {task.duration > 0 && (
                                                <div
                                                    className="absolute h-5 top-1.5 rounded"
                                                    style={{ 
                                                        gridRow: gridRowStart,
                                                        gridColumn: `${offset + 2} / span ${differenceInCalendarDays(endDate, startDate) + 1}`,
                                                        backgroundColor: colorPalette[index % colorPalette.length] + '33', // 20% opacity
                                                    }}
                                                    title={`${task.name} - ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`}
                                                >
                                                    <div 
                                                        className="h-full rounded"
                                                        style={{
                                                            width: `${task.progress || 0}%`,
                                                            backgroundColor: colorPalette[index % colorPalette.length],
                                                        }}
                                                    ></div>
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


export default function PrintGanttPage({ params }: { params: { id: string } }) {
    const [ganttChart, setGanttChart] = React.useState<GanttChart | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        async function fetchGantt() {
            try {
                const chart = await getGanttForPrint(params.id);
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
    }, [params.id]);

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
