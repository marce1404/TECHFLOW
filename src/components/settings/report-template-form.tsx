

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { ReportTemplate, ReportTemplateField } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const fieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre del campo es requerido.'),
  label: z.string().min(1, 'La etiqueta es requerida.'),
  type: z.enum(['text', 'textarea', 'number', 'checkbox', 'date', 'select']),
  required: z.boolean(),
  options: z.literal('technicians').optional(),
});

const templateFormSchema = z.object({
  name: z.string().min(3, 'El nombre de la plantilla es requerido.'),
  description: z.string().min(3, 'La descripción es requerida.'),
  type: z.enum(['service-guide', 'project-delivery'], { required_error: 'Debes seleccionar un tipo de plantilla.'}),
  fields: z.array(fieldSchema).min(1, 'La plantilla debe tener al menos un campo.'),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

interface ReportTemplateFormProps {
  onSave: (data: Omit<ReportTemplate, 'id'>) => void;
  template?: ReportTemplate;
}

export default function ReportTemplateForm({ onSave, template }: ReportTemplateFormProps) {
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'service-guide',
      fields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'fields',
  });

  React.useEffect(() => {
    if (template) {
      form.reset(template);
    } else {
        form.reset({
            name: '',
            description: '',
            type: 'service-guide',
            fields: [],
        });
    }
  }, [template, form]);
  
  const handleAddField = () => {
    append({
        id: crypto.randomUUID(),
        name: `campo_${fields.length + 1}`,
        label: '',
        type: 'text',
        required: false,
    });
  }

  const onSubmit = (data: TemplateFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Define el nombre, descripción y tipo de esta plantilla.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Plantilla</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Informe de Mantenimiento Preventivo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Formato para registrar las tareas realizadas durante el mantenimiento preventivo de sistemas CCTV." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Tipo de Plantilla</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="service-guide" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Guía de Servicio (Simple)
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="project-delivery" />
                            </FormControl>
                            <FormLabel className="font-normal">
                            Entrega de Proyecto (Complejo)
                            </FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
             <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Campos del Formulario</CardTitle>
                    <CardDescription>Define los campos que el técnico deberá completar.</CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={handleAddField}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Campo
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etiqueta del Campo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Requerido</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`fields.${index}.label`}
                          render={({ field }) => (
                              <Input placeholder="Ej: Observaciones del técnico" {...field} />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`fields.${index}.type`}
                          render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                      <SelectItem value="text">Texto Corto</SelectItem>
                                      <SelectItem value="textarea">Texto Largo</SelectItem>
                                      <SelectItem value="number">Número</SelectItem>
                                      <SelectItem value="checkbox">Checkbox</SelectItem>
                                      <SelectItem value="date">Fecha</SelectItem>
                                      <SelectItem value="select">Desplegable</SelectItem>
                                  </SelectContent>
                              </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                          <FormField
                              control={form.control}
                              name={`fields.${index}.required`}
                              render={({ field }) => (
                                  <div className="flex justify-center">
                                  <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                  />
                                  </div>
                              )}
                          />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {form.formState.errors.fields && (
                <p className="text-sm font-medium text-destructive mt-2">{form.formState.errors.fields.message}</p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/report-templates">Cancelar</Link>
          </Button>
          <Button type="submit">Guardar Plantilla</Button>
        </div>
      </form>
    </Form>
  );
}
