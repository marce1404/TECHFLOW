
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
import { CalendarIcon, PlusCircle, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
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

  const { fields, append, remove, swap, replace } = useFieldArray({
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
    let remainingDays = duration - 1; // Duration includes the start day
    let currentDate = startDate;

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
                     <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 items-center text-sm font-medium text-muted-foreground">
                        <div></div>
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
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-2 items-center p-2 rounded-lg border">
                                <div className="flex flex-col">
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => index > 0 && swap(index, index - 1)} disabled={index === 0}>
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => index < fields.length - 1 && swap(index, index + 1)} disabled={index === fields.length - 1}>
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
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
            <CardContent className="overflow-x-auto">
                 {watchedTasks.length > 0 ? (
                    <div className="space-y-2 relative">
                        {watchedTasks.map((task, index) => {
                            if (!task.startDate || !task.duration) {
                                return null;
                            }
                            const startDate = new Date(task.startDate);
                            const duration = task.duration || 1;
                            const endDate = calculateEndDate(startDate, duration, watchedWorkdays[0], watchedWorkdays[1]);
                            const earliestDate = watchedTasks.reduce((earliest, t) => {
                                const tDate = t.startDate ? new Date(t.startDate) : new Date();
                                return tDate < earliest ? tDate : earliest;
                            }, startDate);
                            const offset = differenceInCalendarDays(startDate, earliestDate);
                            const width = differenceInCalendarDays(endDate, startDate) + 1;

                            return (
                                <div key={task.id} className="flex items-center h-10">
                                    <div className="w-48 pr-2 text-sm truncate border-r">{task.name}</div>
                                    <div className="pl-2 flex-1 relative h-full">
                                        <div 
                                            className="absolute bg-primary/80 h-6 top-2 rounded" 
                                            style={{ left: `${offset * 2.5}rem`, width: `${width * 2.5}rem` }}
                                            title={`${task.name} - ${format(startDate, 'dd/MM')} a ${format(endDate, 'dd/MM')}`}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
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
