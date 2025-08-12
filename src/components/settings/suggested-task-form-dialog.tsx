
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
import type { SuggestedTask, Service } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const suggestedTaskFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  category: z.string().min(1, { message: 'Debes seleccionar una categoría.' }),
});

type SuggestedTaskFormValues = z.infer<typeof suggestedTaskFormSchema>;

interface SuggestedTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SuggestedTaskFormValues | SuggestedTask) => void;
  task: SuggestedTask | null;
  categories: Service[];
}

export function SuggestedTaskFormDialog({ open, onOpenChange, onSave, task, categories }: SuggestedTaskFormDialogProps) {
  const form = useForm<SuggestedTaskFormValues>({
    resolver: zodResolver(suggestedTaskFormSchema),
    defaultValues: {
      name: '',
      category: '',
    },
  });

  React.useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        category: task.category,
      });
    } else {
      form.reset({
        name: '',
        category: '',
      });
    }
  }, [task, open, form]);

  const onSubmit = (data: SuggestedTaskFormValues) => {
    if (task) {
      onSave({ ...task, ...data });
    } else {
      onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          <DialogDescription>
            {task ? 'Modifica los detalles de la tarea sugerida.' : 'Completa los detalles para crear una nueva tarea.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Tarea</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Instalación de cámaras" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                            ))}
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
