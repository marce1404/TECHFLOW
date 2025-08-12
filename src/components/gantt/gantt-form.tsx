
'use client';
import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import type { GanttChart, Service } from '@/lib/types';
import Link from 'next/link';
import { useWorkOrders } from '@/context/work-orders-context';


const taskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'El nombre de la tarea es requerido.' }),
  startDate: z.date({ required_error: 'La fecha de inicio es requerida.' }),
  duration: z.coerce.number().min(1, { message: 'La duración debe ser al menos 1.' }),
});

const ganttFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
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
  const { suggestedTasks } = useWorkOrders();
  const [customTaskName, setCustomTaskName] = React.useState('');

  const form = useForm<GanttFormValues>({
    resolver: zodResolver(ganttFormSchema),
    defaultValues: {
      name: ganttChart?.name || '',
      workOnSaturdays: ganttChart?.workOnSaturdays ?? true,
      workOnSundays: ganttChart?.workOnSundays ?? false,
      tasks: ganttChart?.tasks.map(t => ({
          ...t,
          startDate: new Date(t.startDate.toString().replace(/-/g, '/'))
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
            duration: 1
        }));
        replace(newTasks);
    }
  }

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


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSave(data))} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Cronograma</CardTitle>
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
                     <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center text-sm font-medium text-muted-foreground">
                        <div>Nombre de la Tarea</div>
                        <div>Fecha Inicio</div>
                        <div>Duración (días)</div>
                        <div>Fecha Término</div>
                        <div></div>
                    </div>
                    {fields.map((field, index) => {
                        const task = watchedTasks[index];
                        const startDate = task.startDate ? new Date(task.startDate) : new Date();
                        const duration = task.duration || 1;
                        const endDate = calculateEndDate(startDate, duration, watchedWorkdays[0], watchedWorkdays[1]);
                        return (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center p-2 rounded-lg border">
                                <FormField control={form.control} name={`tasks.${index}.name`} render={({ field }) => <Input {...field} />} />
                                <FormField control={form.control} name={`tasks.${index}.startDate`} render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn('w-[200px] justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {field.value ? format(new Date(field.value), 'PPP') : <span>Elegir fecha</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                    </Popover>
                                )}/>
                                <FormField control={form.control} name={`tasks.${index}.duration`} render={({ field }) => <Input type="number" className="w-20" {...field} />} />
                                <Input value={format(endDate, 'PPP')} readOnly className="bg-muted w-[200px]" />
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
                 {watchedTasks.length > 0 && ganttChartData.days.length > 0 ? (
                    <div className="min-w-[800px] p-6">
                        <div className="grid" style={{ gridTemplateColumns: `12rem repeat(${ganttChartData.days.length}, 2rem)`}}>
                           {/* Header */}
                           <div className="sticky left-0 bg-card z-10"></div>
                            {ganttChartData.months.map(([month, dayCount]) => (
                                <div key={month} className="text-center text-sm font-semibold text-muted-foreground capitalize" style={{ gridColumn: `span ${dayCount}` }}>
                                    {month}
                                </div>
                            ))}
                           <div className="sticky left-0 bg-card z-10"></div>
                            {ganttChartData.days.map((day) => (
                                <div key={day.toString()} className="text-center text-xs text-muted-foreground border-r border-dashed">
                                    {format(day, 'd')}
                                </div>
                            ))}

                           {/* Tasks */}
                           {watchedTasks.map((task, index) => {
                                if (!task.startDate || !task.duration) {
                                    return <div key={task.id}></div>;
                                }
                                const startDate = new Date(task.startDate);
                                const endDate = calculateEndDate(startDate, task.duration, watchedWorkdays[0], watchedWorkdays[1]);
                                const offset = differenceInCalendarDays(startDate, ganttChartData.earliestDate!);
                                const durationInDays = differenceInCalendarDays(endDate, startDate) + 1;

                                return (
                                    <React.Fragment key={task.id}>
                                        <div className="sticky left-0 bg-card z-10 text-sm truncate pr-2 py-1 border-t flex items-center">{task.name}</div>
                                        <div className="relative border-t col-span-full h-8" style={{ gridColumnStart: 2, gridRowStart: index + 3}}>
                                            <div
                                                className="absolute bg-primary/80 h-6 top-1 rounded"
                                                style={{ left: `${offset * 2}rem`, width: `${durationInDays * 2}rem` }}
                                                title={`${task.name} - ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`}
                                            ></div>
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
