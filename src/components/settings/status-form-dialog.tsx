
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
import type { OTStatus } from '@/lib/types';

const statusFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
});

type StatusFormValues = z.infer<typeof statusFormSchema>;

interface StatusFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: StatusFormValues | OTStatus) => void;
  status: OTStatus | null;
}

export function StatusFormDialog({ open, onOpenChange, onSave, status }: StatusFormDialogProps) {
  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      name: '',
    },
  });

  React.useEffect(() => {
    if (status) {
      form.reset({
        name: status.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [status, open, form]);

  const onSubmit = (data: StatusFormValues) => {
    if (status) {
      onSave({ ...status, ...data });
    } else {
      onSave(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{status ? 'Editar Estado' : 'Nuevo Estado'}</DialogTitle>
          <DialogDescription>
            {status ? 'Modifica el nombre del estado.' : 'Crea un nuevo estado para las órdenes de trabajo.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: En Progreso" {...field} />
                  </FormControl>
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
