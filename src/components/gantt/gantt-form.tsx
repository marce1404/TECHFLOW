
'use client';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, PlusCircle, Trash2, Printer } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInCalendarDays, eachDayOfInterval, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import type { GanttChart, GanttTask } from '@/lib/types';
import Link from 'next/link';
import { useWorkOrders } from '@/context/work-orders-context';
import { useParams } from 'next/navigation';

const ganttFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  assignedOT: z.string().optional(),
  workOnSaturdays: z.boolean().default(false),
  workOnSundays: z.boolean().default(false),
});

type GanttFormValues = z.infer<typeof ganttFormSchema>;

interface GanttFormProps {
  onSave: (data: Omit<GanttChart, 'id' | 'tasks'>, finalTasks: GanttTask[]) => void;
  ganttChart?: GanttChart;
  initialTasks: GanttTask[]; 
  disabled?: boolean;
}

export default function GanttForm({ onSave, ganttChart, initialTasks, disabled = false }: GanttFormProps) {
  const { activeWorkOrders, ganttCharts } = useWorkOrders();
  const params = useParams();
  const ganttId = params.id as string;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [tasks, setTasks] = React.useState<GanttTask[]>(initialTasks);
  const [customTaskName, setCustomTaskName] = React.useState('');
  const [selectedPhase, setSelectedPhase] = React.useState('');

  const form = useForm<GanttFormValues>({
    resolver: zodResolver(ganttFormSchema),
    defaultValues: {
      name: '',
      assignedOT: '',
      workOnSaturdays: true,
      workOnSundays: false,
    },
  });

  React.useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);


  React.useEffect(() => {
    if (ganttChart) {
      form.reset({
        name: ganttChart.name || '',
        assignedOT: ganttChart.assignedOT || '',
        workOnSaturdays: ganttChart.workOnSaturdays ?? true,
        workOnSundays: ganttChart.workOnSundays ?? false,
      });
    }
  }, [ganttChart, form]);

  const handleUpdateTask = (id: string, field: keyof GanttTask, value: any) => {
    setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === id) {
            return { ...t, [field]: value };
        }
        return t;
    }));
  };
  
  const handleRemoveTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== id));
  };

  const handleAddTask = () => {
    if (customTaskName.trim() && selectedPhase) {
      const realTasks = tasks.filter(t => !t.isPhase);
      const phaseTasks = realTasks.filter(t => t.phase === selectedPhase);
      const maxOrderInPhase = Math.max(...phaseTasks.map(t => t.order || 0), 0);
      
      const newTask: GanttTask = {
        id: crypto.randomUUID(),
        name: customTaskName.trim(),
        startDate: new Date(),
        duration: 1,
        progress: 0,
        isPhase: false,
        phase: selectedPhase,
        order: maxOrderInPhase + 1,
      };

      const phaseIndex = tasks.findIndex(t => t.isPhase && t.name === selectedPhase);
      const newTasks = [...tasks];
      newTasks.splice(phaseIndex + phaseTasks.length + 1, 0, newTask);
      
      setTasks(newTasks);
      setCustomTaskName('');
    }
  };

  const handlePrint = () => {
    if (ganttId) {
      window.open(`/gantt/${ganttId}/print`, '_blank');
    }
  };

  const calculateWorkingDays = (startDate: Date, endDate: Date, workOnSaturdays: boolean, workOnSundays: boolean) => {
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
  
  const calculateEndDate = (startDate: Date, duration: number, workOnSaturdays: boolean, workOnSundays: boolean) => {
    if (duration <= 0) return startDate;
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
  
  const watchedWorkdays = form.watch(['workOnSaturdays', 'workOnSundays']);
  
  const ganttChartData = React.useMemo(() => {
    const validTasks = tasks.filter(t => t.startDate && t.duration > 0 && !t.isPhase);
    if (validTasks.length === 0) {
      return { days: [], months: [], earliestDate: null };
    }

    const earliestDate = new Date(Math.min(...validTasks.map(t => new Date(t.startDate).getTime())));
    const latestDate = new Date(Math.max(...validTasks.map(t => calculateEndDate(new Date(t.startDate), t.duration, watchedWorkdays[0], watchedWorkdays[1]).getTime())));

    if (isNaN(earliestDate.getTime()) || isNaN(latestDate.getTime())) {
      return { days: [], months: [], earliestDate: null };
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

    return { days, months: Object.entries(months), earliestDate };
  }, [tasks, watchedWorkdays]);


  const onSubmitForm = (data: GanttFormValues) => {
    onSave(data, tasks);
  };
  
  const availableOTs = activeWorkOrders.filter(ot => !ganttCharts.some(g => g.assignedOT === ot.ot_number && g.id !== ganttId) || (ganttChart && ganttChart.assignedOT === ot.ot_number));

  const existingPhases = React.useMemo(() => {
    const phases = new Set(tasks.filter(t => !t.isPhase).map(t => t.phase).filter(Boolean));
    return Array.from(phases);
  }, [tasks]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <fieldset disabled={disabled} className="space-y-6">
            <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Detalles del Cronograma</CardTitle>
                    {ganttId && (
                    <Button variant="outline" type="button" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre de la Carta Gantt</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: Instalación CCTV Cliente X" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                    <div className="flex-1">
                        <FormField
                            control={form.control}
                            name="assignedOT"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Asociar a Orden de Trabajo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={disabled}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar OT (Opcional)" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none">Sin asociar</SelectItem>
                                        {availableOTs.map(ot => (
                                            <SelectItem key={ot.id} value={ot.ot_number}>{ot.ot_number} - {ot.description}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Días Laborales</FormLabel>
                        <div className="flex items-center gap-4 pt-2">
                            <FormField
                                control={form.control}
                                name="workOnSaturdays"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="font-normal">Sábado</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="workOnSundays"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <FormLabel className="font-normal">Domingo</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Tareas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="hidden md:grid grid-cols-[1fr,150px,120px,120px,120px,auto] gap-2 items-center text-sm font-medium text-muted-foreground">
                            <div>Nombre de la Tarea</div>
                            <div className="text-center">Fecha Inicio</div>
                            <div className="text-center">Duración (días)</div>
                            <div className="text-center">Avance (%)</div>
                            <div className="text-center">Fecha Término</div>
                            <div></div>
                        </div>
                        {tasks.map((task) => {
                            if (task.isPhase) {
                            return (
                                <div key={task.id} className="flex items-center gap-2 pt-4 pb-2">
                                <h3 className="text-lg font-semibold text-primary flex-1">{task.name}</h3>
                                </div>
                            );
                            }

                            const startDate = task.startDate ? new Date(task.startDate) : new Date();
                            const duration = task.duration || 1;
                            const endDate = calculateEndDate(startDate, duration, watchedWorkdays[0], watchedWorkdays[1]);
                            const isPastOrToday = isPast(startDate) || isToday(startDate);
                            
                            return (
                            <div key={task.id} className="grid grid-cols-1 md:grid-cols-[1fr,150px,120px,120px,120px,auto] gap-2 items-center p-2 rounded-lg border">
                                <Input value={task.name} onChange={(e) => handleUpdateTask(task.id, 'name', e.target.value)} />
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !task.startDate && 'text-muted-foreground')}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {task.startDate ? format(new Date(task.startDate), 'dd/MM/yy', { locale: es }) : <span>Elegir</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><Calendar locale={es} mode="single" selected={task.startDate} onSelect={(date) => handleUpdateTask(task.id, 'startDate', date)} initialFocus /></PopoverContent>
                                </Popover>
                                <Input type="number" className="w-full text-center" value={task.duration} onChange={(e) => handleUpdateTask(task.id, 'duration', parseInt(e.target.value) || 0)} />
                                <Input type="number" className="w-full text-center" value={task.progress} onChange={(e) => handleUpdateTask(task.id, 'progress', parseInt(e.target.value) || 0)} disabled={!isPastOrToday && !disabled} />
                                <Input value={endDate ? format(endDate, 'dd/MM/yy', { locale: es }) : 'N/A'} readOnly className="bg-muted w-full text-center" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveTask(task.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                            )
                        })}
                        <div className="flex items-center gap-2 pt-4 border-t">
                            <Input
                                placeholder="Nombre de tarea personalizada"
                                value={customTaskName}
                                onChange={(e) => setCustomTaskName(e.target.value)}
                                className="flex-1"
                            />
                            <Select onValueChange={setSelectedPhase} value={selectedPhase}>
                                <SelectTrigger className="w-[300px]">
                                    <SelectValue placeholder="Seleccionar fase..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {existingPhases.map(phase => (
                                        <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" variant="outline" onClick={handleAddTask}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Tarea
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Previsualización del Gráfico de Gantt</CardTitle>
                    <CardDescription>
                        Una representación visual simple de tu cronograma.
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    {tasks.length > 0 && ganttChartData.days.length > 0 && ganttChartData.earliestDate ? (
                        <div className="min-w-[800px] p-6">
                            <div className="grid" style={{ gridTemplateColumns: `12rem repeat(${ganttChartData.days.length}, 2rem)`}}>
                            {/* Month Header */}
                            <div className="sticky left-0 bg-card z-10"></div>
                                {ganttChartData.months.map(([month, dayCount]) => (
                                    <div key={month} className="text-center text-sm font-semibold text-muted-foreground capitalize border-b" style={{ gridColumn: `span ${dayCount}` }}>
                                        {month}
                                    </div>
                                ))}
                            {/* Day Header */}
                            <div className="sticky left-0 bg-card z-10"></div>
                                {ganttChartData.days.map((day) => (
                                    <div key={day.toString()} className="text-center text-xs text-muted-foreground border-r border-dashed h-6 flex items-center justify-center">
                                        {format(day, 'd', { locale: es })}
                                    </div>
                                ))}

                            {/* Task Rows */}
                            {tasks.map((task, index) => {
                                    const rowNumber = index + 3; // +3 to account for header rows
                                    if (task.isPhase) {
                                        return (
                                            <React.Fragment key={task.id || index}>
                                                <div className="sticky left-0 bg-card z-10 text-sm truncate pr-2 py-1 border-t flex items-center font-bold text-primary">{task.name}</div>
                                                <div className="relative border-t col-span-full h-8" style={{ gridColumnStart: 2, gridRowStart: rowNumber}}></div>
                                            </React.Fragment>
                                        );
                                    }
                                    
                                    if (!task.startDate || !task.duration || !ganttChartData.earliestDate) {
                                        return <div key={task.id || index} style={{ gridRowStart: rowNumber, gridColumnStart: 1 }}></div>;
                                    }

                                    const startDate = new Date(task.startDate);
                                    const endDate = calculateEndDate(startDate, task.duration, watchedWorkdays[0], watchedWorkdays[1]);
                                    const offset = differenceInCalendarDays(startDate, ganttChartData.earliestDate);
                                    
                                    const totalWorkingDays = calculateWorkingDays(startDate, endDate, watchedWorkdays[0], watchedWorkdays[1]);
                                    if (totalWorkingDays <= 0) return <div key={task.id || index} style={{ gridRowStart: rowNumber, gridColumnStart: 1 }}></div>;

                                    let progressColor = 'bg-primary';
                                    if (isPast(endDate) && (task.progress || 0) < 100) {
                                    progressColor = 'bg-destructive'; // Late and not finished
                                    } else if ((isPast(startDate) || isToday(startDate)) && !isPast(endDate)) {
                                    const elapsedWorkingDays = calculateWorkingDays(startDate, today, watchedWorkdays[0], watchedWorkdays[1]);
                                    const expectedProgress = Math.min(Math.round((elapsedWorkingDays / totalWorkingDays) * 100), 100);
                                    
                                    if ((task.progress || 0) < expectedProgress) {
                                        progressColor = 'bg-destructive'; // Behind schedule
                                    } else {
                                        progressColor = 'bg-green-500'; // On schedule or ahead
                                    }
                                    }
                                    if ((task.progress || 0) >= 100) {
                                        progressColor = 'bg-primary'; // Completed
                                    }


                                    return (
                                        <React.Fragment key={task.id || index}>
                                            <div className="sticky left-0 bg-card z-10 text-sm truncate pr-2 py-1 border-t flex items-center">{task.name}</div>
                                            <div className="relative border-t col-span-full h-8" style={{ gridColumnStart: 2, gridRowStart: rowNumber}}>
                                                <div
                                                    className="absolute bg-secondary h-6 top-1 rounded"
                                                    style={{ left: `${offset * 2}rem`, width: `${(differenceInCalendarDays(endDate, startDate) + 1) * 2}rem` }}
                                                    title={`${task.name} - ${format(startDate, 'dd/MM', { locale: es })} a ${format(endDate, 'dd/MM', { locale: es })}`}
                                                >
                                                    <div className={cn("h-full rounded", progressColor)} style={{ width: `${task.progress || 0}%`}}></div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    )
                            })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground p-8">
                            Añade tareas para ver la previsualización del gráfico.
                        </div>
                    )}
                </CardContent>
            </Card>
        </fieldset>

        {!disabled && (
            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild><Link href="/gantt">Cancelar</Link></Button>
                <Button type="submit">Guardar Carta Gantt</Button>
            </div>
        )}
      </form>
    </Form>
  );
}

    