
'use client';
import type { GanttChart } from '@/lib/types';
import { addDays, differenceInCalendarDays, eachDayOfInterval, format } from 'date-fns';
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
            let convertedDate: Date | null = null;
            if (task.startDate && task.startDate.seconds) { 
                convertedDate = new Timestamp(task.startDate.seconds, task.startDate.nanoseconds).toDate();
            } else if (task.startDate && typeof task.startDate === 'string') {
                convertedDate = new Date(task.startDate.replace(/-/g, '/'));
            } else if (task.startDate) {
                convertedDate = new Date(task.startDate)
            }
            return {
                ...task,
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
    if (duration <= 0) return new Date(startDate);

    let remainingDays = duration;
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - 1); 

    while (remainingDays > 0) {
        currentDate = addDays(currentDate, 1);
        const dayOfWeek = currentDate.getDay();
        
        if ((dayOfWeek !== 6 || workOnSaturdays) && (dayOfWeek !== 0 || workOnSundays)) {
            remainingDays--;
        }
    }
    return currentDate;
};


function PrintGanttPageContent({ ganttChart }: { ganttChart: GanttChart }) {
    
    React.useEffect(() => {
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);

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

    const { days, months, earliestDate } = ganttChartData;
    const dayWidth = 30; // 30px

    return (
        <div className="bg-white text-black p-6 printable-content max-w-full mx-auto">
            <header className="mb-4">
                <h1 className="text-2xl font-headline font-bold">{ganttChart.name}</h1>
                <p className="text-md text-gray-600">OT Asociada: {ganttChart.assignedOT || 'N/A'}</p>
            </header>
            
            {days.length > 0 && earliestDate ? (
                 <div className="grid" style={{ gridTemplateColumns: `250px 60px 1fr` }}>
                    {/* Headers */}
                    <div className="font-semibold p-1 border-y border-l border-gray-300">Tarea</div>
                    <div className="font-semibold p-1 border-y border-gray-300 text-right">Avance %</div>
                    <div className="border-y border-gray-300 overflow-hidden">
                        <div className="relative h-full">
                            <div className="grid h-6" style={{ gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)` }}>
                                {months.map(([month, dayCount]) => (
                                    <div key={month} style={{ gridColumn: `span ${dayCount}`}} className="text-center font-semibold capitalize text-sm border-r border-gray-300">
                                        {month}
                                    </div>
                                ))}
                            </div>
                            <div className="grid h-6" style={{ gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)` }}>
                                {days.map((day, i) => (
                                    <div key={day.toString()} className={`text-center font-normal text-xs border-r ${i === days.length - 1 ? 'border-gray-300' : 'border-gray-300'}`}>
                                        {format(day, 'd')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Task Rows */}
                    {ganttChart.tasks.map((task) => {
                        if (task.isPhase) {
                             return (
                                <div key={task.id} className="col-span-3 p-1 font-bold bg-gray-100 border-b border-gray-300 text-black">
                                    {task.name}
                                </div>
                            )
                        }

                        const taskStartDate = task.startDate ? new Date(task.startDate) : null;
                        if (!taskStartDate || !earliestDate) return null;

                        const taskEndDate = calculateEndDate(taskStartDate, task.duration, ganttChart.workOnSaturdays, ganttChart.workOnSundays);
                        
                        const offsetDays = differenceInCalendarDays(taskStartDate, earliestDate);
                        const left = offsetDays * dayWidth;

                        const durationDays = differenceInCalendarDays(taskEndDate, taskStartDate) + 1;
                        const width = durationDays * dayWidth;
                        
                        const progress = task.progress || 0;
                        const progressWidth = (width * progress) / 100;

                        return (
                             <React.Fragment key={task.id}>
                                <div className="pl-2 pr-1 border-b border-l border-gray-300 truncate text-sm flex items-center">{task.name}</div>
                                <div className="p-1 border-b border-gray-300 text-right font-mono text-sm flex items-center justify-end">{progress}%</div>
                                <div className="p-1 border-b border-r border-gray-300 relative h-8">
                                    <div 
                                        className="absolute top-1/2 -translate-y-1/2 h-5 bg-gray-200 rounded-sm"
                                        style={{ left: `${left}px`, width: `${width}px` }}
                                    >
                                        <div 
                                            className="h-full bg-black rounded-sm"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            ) : (
                 <div className="text-center p-8 border rounded-lg">
                    No hay tareas para mostrar en el gráfico.
                </div>
            )}
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
