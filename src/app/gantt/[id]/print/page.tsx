
import * as React from 'react';
import { getGanttForPrint } from '@/app/actions';
import { notFound } from 'next/navigation';
import PrintButton from './PrintButton';
import { format, addDays, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

const calculateEndDate = (startDate: Date, duration: number, workOnSaturdays: boolean, workOnSundays: boolean) => {
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

const taskColors = [
    '#3CA7FA', // primary
    '#4ade80', // green-400
    '#facc15', // yellow-400
    '#f87171', // red-400
    '#fb923c', // orange-400
    '#a78bfa', // violet-400
    '#22d3ee', // cyan-400
];

export default async function PrintGanttPage({ params }: { params: { id: string } }) {
  const ganttId = params.id;
  const gantt = await getGanttForPrint(ganttId);

  if (!gantt) {
    notFound();
  }

  const { tasks, workOnSaturdays, workOnSundays } = gantt;

  const validTasks = tasks.filter(t => t.startDate && t.duration > 0);
  if (validTasks.length === 0) {
      // Handle case with no valid tasks if necessary
  }

  const earliestDate = validTasks.length > 0 ? new Date(Math.min(...validTasks.map(t => new Date(t.startDate).getTime()))) : new Date();
  const latestDate = validTasks.length > 0 ? new Date(Math.max(...validTasks.map(t => calculateEndDate(new Date(t.startDate), t.duration, workOnSaturdays, workOnSundays).getTime()))) : new Date();

  const days = eachDayOfInterval({ start: earliestDate, end: latestDate });

  const months = days.reduce((acc, day) => {
    const month = format(day, 'MMMM yyyy', { locale: es });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month]++;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white text-black p-8 print:p-4">
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex justify-between items-center pb-4 border-b">
                <div>
                     <h1 className="text-2xl font-bold text-gray-800">APTECH</h1>
                     <p className="text-sm text-gray-500">Cronograma de Proyecto</p>
                </div>
                <div className="no-print">
                    <PrintButton />
                </div>
            </header>

            <main className="space-y-4">
                 <div className="border rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Nombre del Proyecto</p>
                        <p className="font-medium">{gantt.name || 'N/A'}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">OT Asociada</p>
                        <p className="font-medium">{gantt.assignedOT || 'N/A'}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-full inline-block align-middle">
                        <div className="border rounded-lg overflow-hidden">
                            <div className="grid" style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${days.length}, minmax(30px, 1fr))`}}>
                                {/* Header Month */}
                                <div className="font-semibold p-2 border-r border-b bg-gray-50 sticky left-0 z-10" style={{gridRow: 1, gridColumn: 1}}>Tarea</div>
                                {Object.entries(months).map(([month, dayCount], index) => {
                                    const startingColumn = Object.values(months).slice(0, index).reduce((a, b) => a + b, 0);
                                    return (
                                        <div key={month} className="text-center font-semibold p-2 border-r border-b bg-gray-50 capitalize" style={{ gridColumn: `${startingColumn + 2} / span ${dayCount}`, gridRow: 1 }}>
                                            {month}
                                        </div>
                                    )
                                })}

                                {/* Header Day */}
                                <div className="font-semibold p-2 border-r border-b bg-gray-50 sticky left-0 z-10" style={{gridRow: 2, gridColumn: 1}}></div>
                                {days.map((day, index) => (
                                    <div key={day.toISOString()} className="text-center font-semibold p-2 border-r border-b bg-gray-50" style={{gridRow: 2, gridColumn: index + 2}}>
                                        {format(day, 'd')}
                                    </div>
                                ))}

                                {/* Tasks Rows */}
                                {tasks.map((task, index) => {
                                    const startDate = new Date(task.startDate);
                                    const endDate = calculateEndDate(startDate, task.duration, workOnSaturdays, workOnSundays);
                                    const offset = differenceInCalendarDays(startDate, earliestDate);
                                    
                                    let workingDaysCount = 0;
                                    let currentDateIterator = new Date(startDate);
                                    while (currentDateIterator <= endDate) {
                                        const dayOfWeek = currentDateIterator.getDay();
                                        if ((workOnSaturdays || dayOfWeek !== 6) && (workOnSundays || dayOfWeek !== 0)) {
                                            workingDaysCount++;
                                        }
                                        currentDateIterator = addDays(currentDateIterator, 1);
                                    }
                                    
                                    const barColor = taskColors[index % taskColors.length];

                                    return (
                                        <React.Fragment key={task.id}>
                                            <div className="p-2 border-r border-b sticky left-0 bg-white z-10 flex items-center" style={{gridRow: index + 3, gridColumn: 1}}>{task.name}</div>
                                             {/* Empty cells for the row */}
                                            {days.map((_, dayIndex) => (
                                                <div key={dayIndex} className="border-b border-r" style={{ gridRow: index + 3, gridColumn: dayIndex + 2 }}></div>
                                            ))}
                                            {/* Task bar */}
                                            {offset >= 0 && (
                                                <div 
                                                    className="absolute rounded h-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-white text-xs"
                                                    style={{ 
                                                        left: `calc(minmax(200px, 1.5fr) + ${offset} * minmax(30px, 1fr))`,
                                                        marginLeft: `${offset * 1.25}rem`,
                                                        gridRow: index + 3,
                                                        gridColumnStart: offset + 2,
                                                        gridColumnEnd: `span ${differenceInCalendarDays(endDate, startDate) + 1}`,
                                                        width: `calc(${differenceInCalendarDays(endDate, startDate) + 1} * minmax(30px, 1fr))`,
                                                        backgroundColor: barColor,
                                                    }}
                                                    title={`${task.name}: ${task.duration} días`}
                                                >
                                                  <div className="absolute h-full rounded" style={{
                                                    width: `calc(${workingDaysCount} * (100% / ${differenceInCalendarDays(endDate, startDate) + 1}))`,
                                                    backgroundColor: barColor
                                                  }}></div>
                                                </div>
                                            )}
                                             <div
                                                className="absolute rounded h-4 top-1/2 -translate-y-1/2"
                                                style={{
                                                  left: `${offset * 30}px`,
                                                  width: `${workingDaysCount * 30}px`,
                                                  backgroundColor: barColor,
                                                  gridRow: index + 3,
                                                  gridColumnStart: 2,
                                                  zIndex: 20
                                                }}
                                                title={`${task.name}: ${task.duration} días`}
                                              ></div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="pt-8 text-center text-sm text-gray-500">
                <p>Fecha de Emisión: {new Date().toLocaleDateString('es-CL')}</p>
            </footer>
        </div>
         <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(() => {
                window.print();
              }, 500);
            `,
          }}
        />
    </div>
  );
}
