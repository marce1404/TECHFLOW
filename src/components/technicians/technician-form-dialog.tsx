
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Technician } from '@/lib/types';

const technicianFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  specialty: z.string().min(2, { message: 'La especialidad debe tener al menos 2 caracteres.' }),
  area: z.string().min(2, { message: 'El área debe tener al menos 2 caracteres.' }),
  status: z.enum(['Activo', 'Licencia', 'Vacaciones']),
});

type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

interface TechnicianFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TechnicianFormValues | Technician) => void;
  technician: Technician | null;
}

export function TechnicianFormDialog({ open, onOpenChange, onSave, technician }: TechnicianFormDialogProps) {
  const form = useForm<TechnicianFormValues>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: {
      name: '',
      specialty: '',
      area: '',
      status: 'Activo',
    },
  });

  React.useEffect(() => {
    if (technician) {
      form.reset({
        name: technician.name,
        specialty: technician.specialty,
        area: technician.area,
        status: technician.status,
      });
    } else {
      form.reset({
        name: '',
        specialty: '',
        area: '',
        status: 'Activo',
      });
    }
  }, [technician, open, form]);

  const onSubmit = (data: TechnicianFormValues) => {
    if (technician) {
      onSave({ ...technician, ...data });
    } else {
      onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{technician ? 'Editar Técnico' : 'Nuevo Técnico'}</DialogTitle>
          <DialogDescription>
            {technician ? 'Modifica los detalles del técnico.' : 'Completa los detalles para crear un nuevo técnico.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Juan Pérez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidad</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Electricista" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área/Zona</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Zona Norte" {...field} />
                  </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Activo">Activo</SelectItem>
                            <SelectItem value="Licencia">Licencia</SelectItem>
                            <SelectItem value="Vacaciones">Vacaciones</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
