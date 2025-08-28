
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GanttChart, GanttTask } from '@/lib/types';
import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import * as React from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function getGanttForPrint(ganttId: string): Promise<GanttChart | null> {
    try {
        const ganttRef = doc(db, 'gantt-charts', ganttId);
        const ganttSnap = await getDoc(ganttRef);

        if (!ganttSnap.exists()) {
            console.log("No such Gantt Chart document!");
            return null;
        }

        const data = ganttSnap.data();
        if (!data) return null;
        
        const tasks = (data.tasks || []).map((task: any) => {
            const { startDate, ...rest } = task;
            let convertedDate: Date | null = null;
            if (startDate && startDate instanceof Timestamp) {
                convertedDate = startDate.toDate();
            } else if (startDate && typeof startDate === 'string') {
                convertedDate = new Date(startDate);
            } else if (startDate && startDate.seconds) { // Fallback for serialized Timestamps
                convertedDate = new Timestamp(startDate.seconds, startDate.nanoseconds).toDate();
            }
            return {
                ...rest,
                startDate: convertedDate,
            };
        });

        return {
            id: ganttSnap.id,
            name: data.name,
            assignedOT: data.assignedOT,
            workOnSaturdays: data.workOnSaturdays,
            workOnSundays: data.workOnSundays,
            tasks: tasks,
        } as GanttChart;

    } catch (error) {
        console.error("Error getting Gantt chart for print:", error);
        return null;
    }
}


const calculateEndDate = (startDate: Date, duration: number, workOnSaturdays: boolean, workOnSundays: boolean): Date => {
    if (duration === 0) return new Date(startDate);
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
            const dayOfWeek = currentDate.getDay();
            if ((dayOfWeek !== 0 || workOnSundays) && (dayOfWeek !== 6 || workOnSaturdays)) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
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

    const getProgressStyle = (task: GanttTask, endDate: Date): React.CSSProperties => {
        if (!task.startDate) return { backgroundColor: '#ccc' }; // Default gray

        if (isPast(endDate) && (task.progress || 0) < 100) {
            return { 
                backgroundColor: '#777',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 2px, transparent 2px, transparent 4px)',
            };
        }
        return { backgroundColor: '#aaa' }; // On-schedule or Not started - Light Gray
    }
    
    const getProgressBarStyle = (task: GanttTask, endDate: Date): React.CSSProperties => {
        const progress = task.progress || 0;
        if (!task.startDate) return { backgroundColor: '#ccc' }; 

        if (progress >= 100) {
            return { backgroundColor: '#333' }; // Completed - Dark Gray
        }

        const startDate = new Date(task.startDate);

        if (isPast(endDate) && progress < 100) {
            return { 
                backgroundColor: '#777',
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 2px, transparent 2px, transparent 4px)',
            };
        }

        if ((isPast(startDate) || isToday(startDate)) && !isPast(endDate)) {
            const totalWorkingDays = calculateWorkingDays(startDate, endDate, ganttChart.workOnSaturdays, ganttChart.workOnSundays);
            if (totalWorkingDays === 0) return { backgroundColor: '#aaa' };

            const elapsedWorkingDays = calculateWorkingDays(startDate, today, ganttChart.workOnSaturdays, ganttChart.workOnSundays);
            const expectedProgress = Math.min(Math.round((elapsedWorkingDays / totalWorkingDays) * 100), 100);

            if (progress < expectedProgress) {
                 return { 
                    backgroundColor: '#777',
                    backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 2px, transparent 2px, transparent 4px)',
                };
            }
        }
        return { backgroundColor: '#aaa' }; // On-schedule or Not started - Light Gray
    }

    return (
        <div className="bg-white text-black p-8 printable-content max-w-7xl mx-auto">
            <Card className="border-none shadow-none">
                <CardHeader>
                    <CardTitle className="text-2xl font-headline">{ganttChart.name}</CardTitle>
                    <CardDescription>OT Asociada: {ganttChart.assignedOT || 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    {ganttChart.tasks.length > 0 && ganttChartData.days.length > 0 && ganttChartData.earliestDate && ganttChartData.latestDate ? (
                         <div className="min-w-full text-xs">
                             <div className="grid" style={{ gridTemplateColumns: `20rem 5rem repeat(${ganttChartData.days.length}, minmax(1.5rem, 1fr))` }}>
                                {/* Headers */}
                                <div className="sticky left-0 z-10 bg-white border-b border-r font-semibold"></div>
                                <div className="sticky left-0 z-10 bg-white border-b border-r font-semibold"></div>
                                {ganttChartData.months.map(([month, dayCount]) => (
                                    <div key={month} className="text-center font-semibold capitalize border-b border-r" style={{ gridColumn: `span ${dayCount}` }}>
                                        {month}
                                    </div>
                                ))}

                                <div className="sticky left-0 z-10 bg-white border-b border-r font-semibold flex items-end p-1">Tarea</div>
                                <div className="sticky left-0 z-10 bg-white border-b border-r font-semibold flex items-end justify-end p-1">Avance %</div>
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
                                                <div className="sticky left-0 bg-gray-100 z-10 pr-2 py-1 border-b border-r flex items-center font-bold col-span-2" style={{ gridRow: gridRowStart, gridColumn: '1 / span 2' }}>
                                                    {task.name}
                                                </div>
                                                 <div className="bg-gray-100 border-b" style={{ gridRow: gridRowStart, gridColumn: `3 / span ${ganttChartData.days.length}`}}></div>
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
                                    
                                    const progressBarStyle = getProgressBarStyle(task, endDate);
                                    
                                    return (
                                        <React.Fragment key={task.id}>
                                            <div className="sticky left-0 bg-white z-10 pr-2 py-1 border-b border-r flex items-center" style={{ gridRow: gridRowStart }}>
                                                {task.name}
                                            </div>
                                            <div className="sticky left-0 bg-white z-10 pr-2 py-1 border-b border-r flex items-center justify-end font-medium" style={{ gridRow: gridRowStart }}>
                                                {task.progress || 0}%
                                            </div>
                                            <div className="relative border-b border-r h-8" style={{ gridRow: gridRowStart, gridColumn: `3 / span ${ganttChartData.days.length}` }}>
                                                {/* Grid lines */}
                                                {ganttChartData.days.map((_, dayIndex) => (
                                                    <div key={dayIndex} className="inline-block h-full border-r" style={{width: '1.5rem'}}></div>
                                                ))}
                                                {task.duration > 0 && offset >= 0 && (
                                                   <div
                                                        className="absolute h-6 top-1 rounded bg-gray-200"
                                                        style={{ 
                                                            left: `${offset * 1.5}rem`,
                                                            width: `${durationInDays * 1.5}rem`,
                                                        }}
                                                        title={`${task.name} - ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`}
                                                    >
                                                        <div 
                                                            className="h-full rounded"
                                                            style={{
                                                                ...progressBarStyle,
                                                                width: `${task.progress || 0}%`,
                                                            }}
                                                        >
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
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
    const ganttId = params?.id as string;
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
                console.error("Error fetching Gantt data for print:", err);
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
