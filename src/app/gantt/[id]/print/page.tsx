
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

  const earliestDate = new Date(Math.min(...validTasks.map(t => new Date(t.startDate).getTime())));
  const latestDate = new Date(Math.max(...validTasks.map(t => calculateEndDate(new Date(t.startDate), t.duration, workOnSaturdays, workOnSundays).getTime())));

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
                            <div className="grid text-xs" style={{ gridTemplateColumns: `minmax(200px, 1.5fr) repeat(${days.length}, minmax(30px, 1fr))`}}>
                                {/* Header */}
                                <div className="font-semibold p-2 border-r border-b bg-gray-50 sticky left-0 z-10">Tarea</div>
                                {Object.entries(months).map(([month, dayCount]) => (
                                    <div key={month} className="text-center font-semibold p-2 border-r border-b bg-gray-50 capitalize" style={{ gridColumn: `span ${dayCount}` }}>
                                        {month}
                                    </div>
                                ))}

                                <div className="font-semibold p-2 border-r border-b bg-gray-50 sticky left-0 z-10"></div>
                                {days.map((day) => (
                                    <div key={day.toISOString()} className="text-center font-semibold p-2 border-r border-b bg-gray-50">
                                        {format(day, 'd')}
                                    </div>
                                ))}

                                {/* Tasks */}
                                {tasks.map((task, index) => {
                                    const startDate = new Date(task.startDate);
                                    const endDate = calculateEndDate(startDate, task.duration, workOnSaturdays, workOnSundays);
                                    const offset = differenceInCalendarDays(startDate, earliestDate);
                                    let workingDays = 0;
                                    let currentDate = new Date(startDate);
                                    while(currentDate <= endDate) {
                                        const dayOfWeek = currentDate.getDay();
                                        if ((dayOfWeek !== 6 || workOnSaturdays) && (dayOfWeek !== 0 || workOnSundays)) {
                                            workingDays++;
                                        }
                                        currentDate.setDate(currentDate.getDate() + 1);
                                    }

                                    return (
                                        <React.Fragment key={task.id}>
                                            <div className="p-2 border-r border-b sticky left-0 bg-white z-10">{task.name}</div>
                                            <div className="relative border-b" style={{ gridColumn: `${offset + 2} / span ${workingDays}`}}>
                                                <div className="absolute inset-0 bg-blue-500 rounded-full mx-1 my-2"></div>
                                            </div>
                                            {/* Empty cells for timeline */}
                                            <div className="border-b" style={{ gridColumn: `2 / span ${days.length}`}}></div>
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
