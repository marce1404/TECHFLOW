
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import type { Collaborator, WorkOrder } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Separator } from '../ui/separator';
import { useWorkOrders } from '@/context/work-orders-context';
import { MultiSelect } from '../ui/multi-select';


const scheduleFormSchema = z.object({
  workOrderId: z.string().optional(),
  activityName: z.string().optional(),
  startDate: z.date({ required_error: 'La fecha de inicio es requerida.'}),
  endDate: z.date().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Formato de hora inválido (HH:MM).' }),
  assigned: z.array(z.string()).optional(),
  technicians: z.array(z.string()).optional(),
}).refine(data => !!data.workOrderId || !!data.activityName, {
    message: "Debe seleccionar una OT o ingresar un nombre para la actividad.",
    path: ["workOrderId"],
});

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

interface ScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  workOrders: WorkOrder[];
  onSchedule: (data: ScheduleFormValues) => void;
}

export function ScheduleDialog({ open, onOpenChange, date, workOrders, onSchedule }: ScheduleDialogProps) {
    const { collaborators } = useWorkOrders();

    const form = useForm<ScheduleFormValues>({
        resolver: zodResolver(scheduleFormSchema),
        defaultValues: {
            workOrderId: '',
            activityName: '',
            startTime: '09:00',
            endTime: '18:00',
            assigned: [],
            technicians: [],
        },
    });

    const workOrderId = form.watch('workOrderId');

    React.useEffect(() => {
        if (open && date) {
        form.reset({
            workOrderId: '',
            activityName: '',
            startTime: '09:00',
            endTime: '18:00',
            startDate: date,
            endDate: undefined,
            assigned: [],
            technicians: [],
        });
        }
    }, [open, date, form]);

    React.useEffect(() => {
        if(workOrderId) {
            const selectedOrder = workOrders.find(o => o.id === workOrderId);
            if(selectedOrder) {
                form.setValue('assigned', selectedOrder.assigned);
                form.setValue('technicians', selectedOrder.technicians);
            }
        }
    }, [workOrderId, workOrders, form]);


    const onSubmit = (data: ScheduleFormValues) => {
        onSchedule(data);
    };

    const supervisorOptions = collaborators.filter(c => ['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role)).map(c => ({ value: c.name, label: c.name }));
    const technicianOptions = collaborators.filter(c => c.role === 'Técnico').map(c => ({ value: c.name, label: c.name }));


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Orden de Trabajo o Actividad</DialogTitle>
           <DialogDescription>
            {date ? `Agendando para el ${format(date, "d 'de' MMMM, yyyy", { locale: es })}` : ''}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="workOrderId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Orden de Trabajo (Opcional)</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? workOrders.find(
                                (ot) => ot.id === field.value
                              )?.ot_number
                            : "Seleccionar OT"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar OT por número o descripción..." />
                        <CommandList>
                            <CommandEmpty>No se encontraron OTs.</CommandEmpty>
                            <CommandGroup>
                            {workOrders.map((ot) => (
                                <CommandItem
                                value={`${ot.ot_number} ${ot.description} ${ot.client}`}
                                key={ot.id}
                                onSelect={() => {
                                    form.setValue("workOrderId", ot.id)
                                }}
                                >
                                <Check
                                    className={cn(
                                    "mr-2 h-4 w-4",
                                    ot.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                />
                                {ot.ot_number} - {ot.description}
                                </CommandItem>
                            ))}
                            </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">O</span>
                <Separator className="flex-1" />
            </div>

             <FormField
              control={form.control}
              name="activityName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de actividad (si no hay OT)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Visita de diagnóstico Cliente X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="assigned"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Encargados</FormLabel>
                        <MultiSelect
                            options={supervisorOptions}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder="Seleccionar encargados..."
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />
            
             <FormField
                control={form.control}
                name="technicians"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Técnicos</FormLabel>
                        <MultiSelect
                            options={technicianOptions}
                            selected={field.value || []}
                            onChange={field.onChange}
                            placeholder="Seleccionar técnicos..."
                        />
                        <FormMessage />
                    </FormItem>
                )}
            />


             <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Inicio</FormLabel>
                       <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                    ) : (
                                    <span>Elegir fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Término (Opcional)</FormLabel>
                       <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP", { locale: es })
                                    ) : (
                                    <span>Elegir fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date("1900-01-01")}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Inicio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Término</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Agendar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
