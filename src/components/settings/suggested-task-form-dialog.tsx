
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
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';

const suggestedTaskFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  category: z.string().min(1, { message: 'Debes seleccionar una categoría.' }),
  phase: z.string().min(3, { message: 'El nombre de la fase es requerido.' }),
});

type SuggestedTaskFormValues = z.infer<typeof suggestedTaskFormSchema>;

interface SuggestedTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SuggestedTaskFormValues | SuggestedTask) => void;
  task: SuggestedTask | null;
  categories: Service[];
  existingPhases: string[];
}

export function SuggestedTaskFormDialog({ open, onOpenChange, onSave, task, categories, existingPhases }: SuggestedTaskFormDialogProps) {
  const form = useForm<SuggestedTaskFormValues>({
    resolver: zodResolver(suggestedTaskFormSchema),
    defaultValues: {
      name: '',
      category: '',
      phase: '',
    },
  });

  React.useEffect(() => {
    if (open) {
        if (task) { // Editing existing task
        form.reset({
            name: task.name,
            category: task.category,
            phase: task.phase,
        });
        }
    }
  }, [task, open, form]);

  const onSubmit = (data: SuggestedTaskFormValues) => {
    if (task) {
      onSave({ ...task, ...data });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
          <DialogDescription>
            {task ? 'Modifica los detalles de la tarea sugerida.' : `Añade una nueva tarea a la fase.`}
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
             <FormField
                control={form.control}
                name="phase"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Fase del Proyecto</FormLabel>
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
                                    ? existingPhases.find(
                                        (phase) => phase === field.value
                                    ) || field.value
                                    : "Seleccionar o crear fase"}
                                <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput
                                    placeholder="Buscar o crear fase..."
                                    onValueChange={(currentValue) => field.onChange(currentValue)}
                                />
                                <CommandList>
                                    <CommandEmpty>No se encontraron fases.</CommandEmpty>
                                    <CommandGroup>
                                    {existingPhases.map((phase) => (
                                        <CommandItem
                                        value={phase}
                                        key={phase}
                                        onSelect={() => {
                                            form.setValue("phase", phase)
                                        }}
                                        >
                                        {phase}
                                        <CheckIcon
                                            className={cn(
                                            "ml-auto h-4 w-4",
                                            phase === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
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

    