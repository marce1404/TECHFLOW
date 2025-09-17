
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from "date-fns";
import { es } from 'date-fns/locale';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Collaborator, Vehicle } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Textarea } from '../ui/textarea';

const maintenanceSchema = z.object({
  id: z.string(),
  date: z.string().min(1, 'La fecha es requerida'),
  description: z.string().min(3, 'La descripción es requerida'),
  cost: z.coerce.number().min(0, 'El costo no puede ser negativo'),
  mileage: z.coerce.number().min(0, 'El kilometraje no puede ser negativo'),
});

const vehicleFormSchema = z.object({
  model: z.string().min(3, { message: 'El modelo debe tener al menos 3 caracteres.' }),
  company: z.string().optional(),
  year: z.coerce.number().min(1990, "El año debe ser válido."),
  plate: z.string().min(6, { message: 'La patente debe tener al menos 6 caracteres.' }),
  status: z.enum(['Disponible', 'Asignado', 'En Mantenimiento']),
  assignedTo: z.string().optional(),
  maintenanceLog: z.array(maintenanceSchema).optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  onSave: (data: VehicleFormValues) => void;
  vehicle?: Vehicle | null;
  collaborators: Collaborator[];
  disabled?: boolean;
}


export default function VehicleForm({ onSave, vehicle, collaborators, disabled = false }: VehicleFormProps) {
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      model: '',
      company: '',
      year: new Date().getFullYear(),
      plate: '',
      status: 'Disponible',
      assignedTo: '',
      maintenanceLog: [],
    },
  });

  const { fields: maintenanceFields, append: appendMaintenance, remove: removeMaintenance } = useFieldArray({
    control: form.control, name: "maintenanceLog"
  });

  const watchAssignedTo = form.watch('assignedTo');

  React.useEffect(() => {
    if (watchAssignedTo && watchAssignedTo !== 'none') {
        form.setValue('status', 'Asignado');
    } else if (form.getValues('status') === 'Asignado') {
        form.setValue('status', 'Disponible');
    }
  }, [watchAssignedTo, form]);

  React.useEffect(() => {
    if (vehicle) {
      form.reset({
        model: vehicle.model || '',
        company: vehicle.company || '',
        year: vehicle.year || new Date().getFullYear(),
        plate: vehicle.plate || '',
        status: vehicle.status || 'Disponible',
        assignedTo: vehicle.assignedTo || 'none',
        maintenanceLog: vehicle.maintenanceLog || [],
      });
    } else {
        form.reset({
            model: '',
            company: '',
            year: new Date().getFullYear(),
            plate: '',
            status: 'Disponible',
            assignedTo: 'none',
            maintenanceLog: [],
        });
    }
  }, [vehicle, form]);

  const onSubmit = (data: VehicleFormValues) => {
    const dataToSave = {
      ...data,
      assignedTo: data.assignedTo === 'none' ? '' : data.assignedTo,
    };
    onSave(dataToSave);
  };
  
  const statusIsOverridden = form.getValues('status') === 'En Mantenimiento';


  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <fieldset disabled={disabled} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Información del Vehículo</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="model"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Marca y Modelo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Chevrolet N400 Max" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Empresa (Opcional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: OSESA, Arriendo..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Año</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ej: 2021" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="plate"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Patente</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: PPU-1234" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assignedTo"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Asignado A</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || 'none'} disabled={disabled}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar colaborador (opcional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">N/A</SelectItem>
                                            {collaborators.filter(t => t.status === 'Activo').map(t => (
                                                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={disabled || (!statusIsOverridden && !!watchAssignedTo && watchAssignedTo !== 'none')}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar estado" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Disponible">Disponible</SelectItem>
                                                <SelectItem value="Asignado">Asignado</SelectItem>
                                                <SelectItem value="En Mantenimiento">En Mantenimiento</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Registro de Mantenimiento y Reparaciones</CardTitle>
                            <Button type="button" size="sm" variant="outline" onClick={() => appendMaintenance({ id: crypto.randomUUID(), date: format(new Date(), 'yyyy-MM-dd'), description: '', cost: 0, mileage: 0 })} disabled={disabled}>
                                <PlusCircle className="mr-2 h-4 w-4"/>
                                Añadir Registro
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Fecha</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="w-[120px]">Costo</TableHead>
                                    <TableHead className="w-[120px]">Kilometraje</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {maintenanceFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>
                                            <FormField 
                                                control={form.control} 
                                                name={`maintenanceLog.${index}.date`}
                                                render={({ field }) => (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={disabled}>
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? format(new Date(field.value.replace(/-/g, '/')), "dd/MM/yy", { locale: es }) : <span>Elegir</span>}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value.replace(/-/g, '/')) : undefined} onSelect={(d) => field.onChange(d ? format(d, 'yyyy-MM-dd') : '')} initialFocus locale={es} /></PopoverContent>
                                                    </Popover>
                                                )} 
                                            />
                                        </TableCell>
                                        <TableCell><FormField control={form.control} name={`maintenanceLog.${index}.description`} render={({ field }) => <Textarea {...field} placeholder="Cambio de aceite, revisión de frenos..."/>} /></TableCell>
                                        <TableCell><FormField control={form.control} name={`maintenanceLog.${index}.cost`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                                        <TableCell><FormField control={form.control} name={`maintenanceLog.${index}.mileage`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeMaintenance(index)} disabled={disabled}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {maintenanceFields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No hay registros de mantenimiento.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </fieldset>

            {!disabled && (
                <div className="flex justify-end gap-2">
                    <Button variant="outline" asChild><Link href="/vehicles">Cancelar</Link></Button>
                    <Button type="submit">Guardar Cambios</Button>
                </div>
            )}
        </form>
    </Form>
  );
}
