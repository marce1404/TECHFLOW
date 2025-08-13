
'use client';
import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { format, addDays, differenceInCalendarDays, eachDayOfInterval, isPast } from 'date-fns';
import type { GanttChart, Service, WorkOrder } from '@/lib/types';
import Link from 'next/link';
import { useWorkOrders } from '@/context/work-orders-context';
import { useParams, useRouter } from 'next/navigation';


const taskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'El nombre de la tarea es requerido.' }),
  startDate: z.date({ required_error: 'La fecha de inicio es requerida.' }),
  duration: z.coerce.number().min(1, { message: 'La duración debe ser al menos 1.' }),
  progress: z.coerce.number().min(0).max(100).optional().default(0),
});

const ganttFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  assignedOT: z.string().optional(),
  workOnSaturdays: z.boolean().default(false),
  workOnSundays: z.boolean().default(false),
  tasks: z.array(taskSchema),
});

type GanttFormValues = z.infer<typeof ganttFormSchema>;

interface GanttFormProps {
  onSave: (data: Omit<GanttChart, 'id'>) => void;
  services: Service[];
  ganttChart?: GanttChart;
}

export default function GanttForm({ onSave, services, ganttChart }: GanttFormProps) {
  const { suggestedTasks, activeWorkOrders } = useWorkOrders();
  const [customTaskName, setCustomTaskName] = React.useState('');
  const router = useRouter();
  const params = useParams();
  const ganttId = params.id as string;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const form = useForm<GanttFormValues>({
    resolver: zodResolver(ganttFormSchema),
    defaultValues: {
      name: ganttChart?.name || '',
      assignedOT: ganttChart?.assignedOT || '',
      workOnSaturdays: ganttChart?.workOnSaturdays ?? true,
      workOnSundays: ganttChart?.workOnSundays ?? false,
      tasks: ganttChart?.tasks.map(t => ({
          ...t,
          progress: t.progress || 0,
          // Ensure startDate is a Date object, converting from string or Firestore Timestamp
          startDate: t.startDate ? new Date(t.startDate.toString().replace(/-/g, '/')) : new Date(),
      })) || [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'tasks',
  });

  const handleAddTask = () => {
    if (customTaskName.trim()) {
      append({
        id: crypto.randomUUID(),
        name: customTaskName.trim(),
        startDate: new Date(),
        duration: 1,
        progress: 0,
      });
      setCustomTaskName('');
    }
  };

  const handleSuggestedTasks = (category: string) => {
    const tasksToLoad = suggestedTasks.filter(t => t.category === category);
    if (tasksToLoad.length > 0) {
        const newTasks = tasksToLoad.map(task => ({
            id: crypto.randomUUID(),
            name: task.name,
            startDate: new Date(),
            duration: 1,
            progress: 0,
        }));
        replace(newTasks);
    }
  }

  const handlePrint = () => {
    if (ganttId) {
      window.open(`/gantt/${ganttId}/print`, '_blank');
    } else {
        // Maybe show a toast notification that the gantt chart needs to be saved first.
        // For now, we just disable the button if there is no ganttId
    }
  };

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
  
  const watchedTasks = form.watch('tasks');
  const watchedWorkdays = form.watch(['workOnSaturdays', 'workOnSundays']);
  
  const ganttChartData = React.useMemo(() => {
    if (!watchedTasks || watchedTasks.length === 0) {
      return { days: [], months: [], earliestDate: null };
    }

    const validTasks = watchedTasks.filter(t => t.startDate && t.duration > 0);
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
      const month = format(day, 'MMMM yyyy');
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month]++;
      return acc;
    }, {} as Record<string, number>);

    return { days, months: Object.entries(months), earliestDate };
  }, [watchedTasks, watchedWorkdays]);


  const onSubmitForm = (data: GanttFormValues) => {
    const dataToSave = {
        ...data,
        assignedOT: data.assignedOT === 'none' ? '' : data.assignedOT,
    };
    onSave(dataToSave);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Detalles del Cronograma</CardTitle>
                <Button variant="outline" type="button" onClick={handlePrint} disabled={!ganttId}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                </Button>
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
                            <FormLabel>Asignar a OT (Opcional)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar OT..." />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">Ninguna</SelectItem>
                                    {activeWorkOrders.map((ot: WorkOrder) => (
                                        <SelectItem key={ot.id} value={ot.ot_number}>
                                            {ot.ot_number} - {ot.description}
                                        </SelectItem>
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
            
            <div>
              <FormLabel>Cargar Tareas Sugeridas (Opcional)</FormLabel>
              <Select onValueChange={handleSuggestedTasks}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar una categoría de servicio..." />
                </SelectTrigger>
                <SelectContent>
                  {services.filter(s => s.status === 'Activa').map(service => (
                    <SelectItem key={service.id} value={service.name.toLowerCase()}>{service.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    {fields.map((field, index) => {
                        const task = watchedTasks[index];
                        const startDate = task.startDate ? new Date(task.startDate) : new Date();
                        const duration = task.duration || 1;
                        const endDate = calculateEndDate(startDate, duration, watchedWorkdays[0], watchedWorkdays[1]);
                        const isPastTask = isPast(startDate) || startDate.getTime() === today.getTime();
                        return (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr,150px,120px,120px,120px,auto] gap-2 items-center p-2 rounded-lg border">
                                <Controller
                                    control={form.control}
                                    name={`tasks.${index}.name`}
                                    render={({ field }) => <Input {...field} />}
                                />
                                <Controller
                                    control={form.control}
                                    name={`tasks.${index}.startDate`}
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value ? format(new Date(field.value), 'dd/MM/yy') : <span>Elegir</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                    )}
                                />
                                <Controller
                                    control={form.control}
                                    name={`tasks.${index}.duration`}
                                    render={({ field }) => <Input type="number" className="w-full text-center" {...field} />}
                                />
                                 <Controller
                                    control={form.control}
                                    name={`tasks.${index}.progress`}
                                    render={({ field }) => <Input type="number" className="w-full text-center" {...field} disabled={!isPastTask} />}
                                />
                                <Input value={endDate ? format(endDate, 'dd/MM/yy') : 'N/A'} readOnly className="bg-muted w-full text-center" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        )
                    })}
                     <div className="flex items-center gap-2 pt-4">
                        <Input
                            placeholder="Nombre de tarea personalizada"
                            value={customTaskName}
                            onChange={(e) => setCustomTaskName(e.target.value)}
                        />
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
                 {watchedTasks.length > 0 && ganttChartData.days.length > 0 && ganttChartData.earliestDate ? (
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
                                    {format(day, 'd')}
                                </div>
                            ))}

                           {/* Task Rows */}
                           {watchedTasks.map((task, index) => {
                                if (!task.startDate || !task.duration || !ganttChartData.earliestDate) {
                                    return <div key={task.id || index}></div>;
                                }
                                const startDate = new Date(task.startDate);
                                const endDate = calculateEndDate(startDate, task.duration, watchedWorkdays[0], watchedWorkdays[1]);
                                const offset = differenceInCalendarDays(startDate, ganttChartData.earliestDate);
                                
                                // Calculate duration considering only working days
                                let workingDays = 0;
                                let currentDate = new Date(startDate);
                                while(currentDate <= endDate) {
                                    const dayOfWeek = currentDate.getDay();
                                    const isSaturday = dayOfWeek === 6;
                                    const isSunday = dayOfWeek === 0;
                                    if ((!isSaturday || watchedWorkdays[0]) && (!isSunday || watchedWorkdays[1])) {
                                        workingDays++;
                                    }
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }

                                return (
                                    <React.Fragment key={task.id || index}>
                                        <div className="sticky left-0 bg-card z-10 text-sm truncate pr-2 py-1 border-t flex items-center">{task.name}</div>
                                        <div className="relative border-t col-span-full h-8" style={{ gridColumnStart: 2, gridRowStart: index + 3}}>
                                            <div
                                                className="absolute bg-secondary h-6 top-1 rounded"
                                                style={{ left: `${offset * 2}rem`, width: `${workingDays * 2}rem` }}
                                                title={`${task.name} - ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`}
                                            >
                                                <div className="bg-primary h-full rounded" style={{ width: `${task.progress || 0}%`}}></div>
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

        <div className="flex justify-end gap-2">
            <Button variant="outline" asChild><Link href="/gantt">Cancelar</Link></Button>
            <Button type="submit">Guardar Carta Gantt</Button>
        </div>
      </form>
    </Form>
  );
}
