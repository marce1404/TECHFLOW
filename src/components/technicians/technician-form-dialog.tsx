
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from "date-fns";
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
import type { Technician, WorkClothingItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const workClothingSchema = z.object({
  id: z.string(),
  item: z.string().min(1, "Item es requerido."),
  size: z.string().min(1, "Talla es requerida."),
  quantity: z.coerce.number().min(1, "Cantidad debe ser al menos 1."),
  deliveryDate: z.string().min(1, "Fecha de entrega es requerida."),
  expirationDate: z.string().min(1, "Fecha de caducidad es requerida."),
});

const technicianFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  specialty: z.string().min(2, { message: 'La especialidad debe tener al menos 2 caracteres.' }),
  area: z.string().min(2, { message: 'El área debe tener al menos 2 caracteres.' }),
  status: z.enum(['Activo', 'Licencia', 'Vacaciones']),
  license: z.string().min(1, { message: 'La licencia es requerida.' }),
  workClothing: z.array(workClothingSchema),
});

type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

interface TechnicianFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Technician, 'id'> | Technician) => void;
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
      license: '',
      workClothing: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "workClothing"
  });

  React.useEffect(() => {
    if (technician) {
      form.reset({
        name: technician.name,
        specialty: technician.specialty,
        area: technician.area,
        status: technician.status,
        license: technician.license,
        workClothing: technician.workClothing,
      });
    } else {
      form.reset({
        name: '',
        specialty: '',
        area: '',
        status: 'Activo',
        license: '',
        workClothing: [],
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
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{technician ? 'Editar Técnico' : 'Nuevo Técnico'}</DialogTitle>
          <DialogDescription>
            {technician ? 'Modifica los detalles del técnico.' : 'Completa los detalles para crear un nuevo técnico.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Información del Técnico</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormField
                        control={form.control}
                        name="license"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Licencia de Conducir</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: Clase B" {...field} />
                            </FormControl>
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
                        <CardTitle>Vestimenta de Trabajo</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => append({ id: crypto.randomUUID(), item: '', size: '', quantity: 1, deliveryDate: '', expirationDate: '' })}>
                            <PlusCircle className="mr-2"/>
                            Añadir Fila
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Talla</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Fecha de Entrega</TableHead>
                                <TableHead>Fecha de Caducidad</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workClothing.${index}.item`}
                                            render={({ field }) => <Input {...field} placeholder="Pantalón Corporativo"/>}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <FormField
                                            control={form.control}
                                            name={`workClothing.${index}.size`}
                                            render={({ field }) => <Input {...field} placeholder="M"/>}
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <FormField
                                            control={form.control}
                                            name={`workClothing.${index}.quantity`}
                                            render={({ field }) => <Input type="number" {...field} />}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workClothing.${index}.deliveryDate`}
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn("w-[150px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(new Date(field.value.replace(/-/g, '/')), "PPP") : <span>Elegir fecha</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value.replace(/-/g, '/')) : undefined}
                                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`workClothing.${index}.expirationDate`}
                                            render={({ field }) => (
                                                 <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn("w-[150px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}
                                                        >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {field.value ? format(new Date(field.value.replace(/-/g, '/')), "PPP") : <span>Elegir fecha</span>}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value.replace(/-/g, '/')) : undefined}
                                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DialogFooter className="sticky bottom-0 bg-background py-4">
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
