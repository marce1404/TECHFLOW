
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Collaborator, Vehicle } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Link from 'next/link';

const vehicleFormSchema = z.object({
  model: z.string().min(3, { message: 'El modelo debe tener al menos 3 caracteres.' }),
  year: z.coerce.number().min(1990, "El año debe ser válido."),
  plate: z.string().min(6, { message: 'La patente debe tener al menos 6 caracteres.' }),
  status: z.enum(['Disponible', 'Asignado', 'En Mantenimiento']),
  assignedTo: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  onSave: (data: VehicleFormValues) => void;
  vehicle?: Vehicle | null;
  collaborators: Collaborator[];
}


export default function VehicleForm({ onSave, vehicle, collaborators }: VehicleFormProps) {
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      status: 'Disponible',
      assignedTo: '',
    },
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
        model: vehicle.model,
        year: vehicle.year,
        plate: vehicle.plate,
        status: vehicle.status,
        assignedTo: vehicle.assignedTo || 'none',
      });
    } else {
        form.reset({
            model: '',
            year: new Date().getFullYear(),
            plate: '',
            status: 'Disponible',
            assignedTo: 'none',
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!statusIsOverridden && !!watchAssignedTo && watchAssignedTo !== 'none'}>
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

            <div className="flex justify-end gap-2">
                <Button variant="outline" asChild><Link href="/vehicles">Cancelar</Link></Button>
                <Button type="submit">Guardar Cambios</Button>
            </div>
        </form>
    </Form>
  );
}
