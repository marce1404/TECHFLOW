
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GanttChart, GanttTask } from '@/lib/types';
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
            const { startDate, ...rest } = task;
            let convertedDate: Date | null = null;
            if (startDate && startDate instanceof Timestamp) {
                convertedDate = startDate.toDate();
            } else if (startDate && typeof startDate === 'string') {
                convertedDate = new Date(startDate.includes('T') ? startDate : startDate.replace(/-/g, '/'));
            } else if (startDate && startDate.seconds) { 
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
    if (duration <= 0) return new Date(startDate);

    let remainingDays = duration;
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - 1); 

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

// Helper function to calculate working days between two dates
const calculateWorkingDays = (start: Date, end: Date, workOnSaturdays: boolean, workOnSundays: boolean) => {
    let count = 0;
    const interval = eachDayOfInterval({ start, end });
    for (const day of interval) {
        const dayOfWeek = day.getDay();
        if (dayOfWeek === 6 && !workOnSaturdays) continue;
        if (dayOfWeek === 0 && !workOnSundays) continue;
        count++;
    }
    return count;
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

    return (
        <div className="bg-white text-black p-4 printable-content max-w-full mx-auto">
            <header className="mb-4">
                <h1 className="text-2xl font-headline font-bold">{ganttChart.name}</h1>
                <p className="text-md text-gray-600">OT Asociada: {ganttChart.assignedOT || 'N/A'}</p>
            </header>
            
            {days.length > 0 && earliestDate ? (
                <table className="w-full border-collapse text-xs table-fixed">
                    <colgroup>
                        <col style={{ width: '250px' }} />
                        <col style={{ width: '60px' }} />
                        {days.map((_, i) => <col key={i} style={{ width: 'auto' }} />)}
                    </colgroup>
                    <thead>
                        <tr className="border-t border-b border-gray-400">
                            <th className="border-r border-gray-400 p-1 align-bottom text-left font-semibold">Tarea</th>
                            <th className="border-r border-gray-400 p-1 align-bottom text-right font-semibold">Avance %</th>
                            {months.map(([month, dayCount]) => (
                                <th key={month} colSpan={dayCount} className="border-r border-gray-400 p-1 text-center font-semibold capitalize">
                                    {month}
                                </th>
                            ))}
                        </tr>
                        <tr className="border-b border-gray-400">
                            <th className="border-r border-gray-400 p-1"></th>
                            <th className="border-r border-gray-400 p-1"></th>
                            {days.map((day) => (
                                <th key={day.toString()} className="border-r border-gray-400 p-1 font-normal w-[25px] h-[25px]">
                                    {format(day, 'd')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {ganttChart.tasks.map((task) => {
                            if (task.isPhase) {
                                return (
                                    <tr key={task.id} className="border-b border-gray-300">
                                        <td colSpan={2 + days.length} className="p-1 font-bold bg-gray-100">{task.name}</td>
                                    </tr>
                                )
                            }
                            
                            const taskStartDate = task.startDate ? new Date(task.startDate) : null;
                            const taskEndDate = taskStartDate ? calculateEndDate(taskStartDate, task.duration, ganttChart.workOnSaturdays, ganttChart.workOnSundays) : null;
                            const totalWorkingDays = taskStartDate && taskEndDate ? calculateWorkingDays(taskStartDate, taskEndDate, ganttChart.workOnSaturdays, ganttChart.workOnSundays) : 0;
                            const progressDays = Math.round(totalWorkingDays * ((task.progress || 0) / 100));
                            
                            let completedDaysRendered = 0;

                            return (
                                <tr key={task.id} className="border-b border-gray-300 h-6">
                                    <td className="border-r border-gray-400 p-1 text-xs">{task.name}</td>
                                    <td className="border-r border-gray-400 p-1 text-xs text-right font-mono">{task.progress || 0}%</td>
                                    {days.map((day, dayIndex) => {
                                        const isInRange = taskStartDate && taskEndDate && day >= taskStartDate && day <= taskEndDate;
                                        let content = '';

                                        if (isInRange) {
                                            const dayOfWeek = day.getDay();
                                            const isWorkingDay = (dayOfWeek !== 6 || ganttChart.workOnSaturdays) && (dayOfWeek !== 0 || ganttChart.workOnSundays);
                                            
                                            if (isWorkingDay) {
                                                if(completedDaysRendered < progressDays) {
                                                    content = '█';
                                                    completedDaysRendered++;
                                                } else {
                                                    content = '➕';
                                                }
                                            }
                                        }

                                        return (
                                            <td key={dayIndex} className="border-r border-gray-400 text-center p-0 h-full w-full leading-none text-base font-mono">
                                                {content}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
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
