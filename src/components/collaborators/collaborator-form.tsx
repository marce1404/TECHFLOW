
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addYears } from "date-fns";
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
import type { Collaborator } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn, normalizeString } from '@/lib/utils';
import Link from 'next/link';

const workClothingSchema = z.object({
  id: z.string(),
  item: z.string().optional(),
  size: z.string().optional(),
  quantity: z.coerce.number().optional(),
  deliveryDate: z.string().optional(),
  expirationDate: z.string().optional(),
});

const eppSchema = z.object({
  id: z.string(),
  item: z.string().optional(),
  size: z.string().optional(),
  quantity: z.coerce.number().optional(),
  deliveryDate: z.string().optional(),
  expirationDate: z.string().optional(),
});

const certificationSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  issuingOrganization: z.string().optional(),
  issueDate: z.string().optional(),
  expirationDate: z.string().optional(),
});

const collaboratorFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Debe ser un correo electrónico válido.' }).optional().or(z.literal('')),
  role: z.string().min(1, "El cargo es requerido."),
  area: z.string().optional(),
  status: z.string().min(1, "El estado es requerido."),
  license: z.string().optional(),
  workClothing: z.array(workClothingSchema),
  epp: z.array(eppSchema),
  certifications: z.array(certificationSchema),
});

export type CollaboratorFormValues = z.infer<typeof collaboratorFormSchema>;

interface CollaboratorFormProps {
  onSave: (data: CollaboratorFormValues) => void;
  collaborator?: Collaborator | null;
  disabled?: boolean;
}

const defaultClothingItems = [
    "Pantalón Corporativo",
    "Camisa Corporativa",
    "Polera",
    "Chaleco Geólogo",
    "Parca",
    "Corta Viento",
    "Primera Capa",
];

const defaultEppItems = [
    "Casco de seguridad",
    "Lentes de seguridad",
    "Guantes de seguridad",
    "Zapatos de seguridad",
    "Arnés de seguridad",
];

const defaultCertificationItems = [
    "Trabajo en altura geográfica",
    "Trabajo en Altura física",
    "Espacios confinados",
    "Operador Elevador",
];

export default function CollaboratorForm({ onSave, collaborator, disabled = false }: CollaboratorFormProps) {
  const form = useForm<CollaboratorFormValues>({
    resolver: zodResolver(collaboratorFormSchema),
    defaultValues: {
        name: '',
        email: '',
        role: '',
        area: '',
        status: '',
        license: '',
        workClothing: [],
        epp: [],
        certifications: [],
    }
  });
  
  const { fields: workClothingFields, append: appendWorkClothing, remove: removeWorkClothing } = useFieldArray({
    control: form.control, name: "workClothing"
  });
  const { fields: eppFields, append: appendEpp, remove: removeEpp } = useFieldArray({
    control: form.control, name: "epp"
  });
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } = useFieldArray({
    control: form.control, name: "certifications"
  });

  const roles: Collaborator['role'][] = ['Técnico', 'Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado', 'Comercial'];
  const statuses: Collaborator['status'][] = ['Activo', 'Licencia', 'Vacaciones'];

  React.useEffect(() => {
    if (collaborator) {
      const findCaseInsensitive = (value: string | undefined, options: string[]) => {
            if (!value) return '';
            const normalizedValue = normalizeString(value);
            const found = options.find(opt => normalizeString(opt) === normalizedValue);
            return found || '';
      };
      
      const defaults = {
        name: collaborator.name || '',
        email: collaborator.email || '',
        role: findCaseInsensitive(collaborator.role, roles) as Collaborator['role'] || '',
        area: collaborator.area || '',
        status: findCaseInsensitive(collaborator.status, statuses) as Collaborator['status'] || '',
        license: collaborator.license || '',
        workClothing: collaborator.workClothing || [],
        epp: collaborator.epp || [],
        certifications: collaborator.certifications || [],
      };
      form.reset(defaults);
    } else {
        const defaultWorkClothing = defaultClothingItems.map(item => ({
            id: crypto.randomUUID(),
            item,
            size: '',
            quantity: 0,
            deliveryDate: '',
            expirationDate: '',
        }));
        const defaultEpp = defaultEppItems.map(item => ({
            id: crypto.randomUUID(),
            item,
            size: '',
            quantity: 0,
            deliveryDate: '',
            expirationDate: '',
        }));
        const defaultCertifications = defaultCertificationItems.map(name => ({
            id: crypto.randomUUID(),
            name,
            issuingOrganization: '',
            issueDate: '',
            expirationDate: '',
        }));
      form.reset({
        name: '',
        email: '',
        role: 'Técnico',
        area: '',
        status: 'Activo',
        license: '',
        workClothing: defaultWorkClothing,
        epp: defaultEpp,
        certifications: defaultCertifications,
      });
    }
  }, [collaborator, form]);

  const onSubmit = (data: CollaboratorFormValues) => {
    onSave(data);
  };

  const handleDeliveryDateChange = (date: Date | undefined, index: number, fieldName: 'workClothing' | 'epp' | 'certifications') => {
      if (date) {
        const deliveryDateStr = format(date, 'yyyy-MM-dd');
        const expirationDate = addYears(date, 1);
        const expirationDateStr = format(expirationDate, 'yyyy-MM-dd');
        
        switch (fieldName) {
            case 'workClothing':
                form.setValue(`workClothing.${index}.deliveryDate`, deliveryDateStr);
                form.setValue(`workClothing.${index}.expirationDate`, expirationDateStr);
                break;
            case 'epp':
                form.setValue(`epp.${index}.deliveryDate`, deliveryDateStr);
                form.setValue(`epp.${index}.expirationDate`, expirationDateStr);
                break;
            case 'certifications':
                 form.setValue(`certifications.${index}.issueDate`, deliveryDateStr);
                 form.setValue(`certifications.${index}.expirationDate`, expirationDateStr);
                 break;
        }
      }
  }

  const renderDateField = (field: any, index: number, fieldType: 'deliveryDate' | 'issueDate' | 'expirationDate', arrayName: 'workClothing' | 'epp' | 'certifications') => (
    <Popover>
        <PopoverTrigger asChild>
            <Button
            variant={"outline"}
            className={cn("w-[180px] justify-start text-left font-normal", !field.value && "text-muted-foreground")}
            disabled={disabled}
            >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? format(new Date(field.value.replace(/-/g, '/')), "PPP", { locale: es }) : <span>Elegir fecha</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={field.value ? new Date(field.value.replace(/-/g, '/')) : undefined}
                onSelect={(date) => {
                    if (fieldType === 'deliveryDate' || fieldType === 'issueDate') {
                         handleDeliveryDateChange(date, index, arrayName)
                    } else {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                    }
                }}
                initialFocus
                locale={es}
            />
        </PopoverContent>
    </Popover>
  );

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <fieldset disabled={disabled} className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Información del Colaborador</CardTitle></CardHeader>
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
                          name="email"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Correo Electrónico</FormLabel>
                                  <FormControl>
                                      <Input type="email" placeholder="ejemplo@correo.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                        />
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cargo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar cargo" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roles.map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Área</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej: RM, Zona Norte..." {...field} value={field.value ?? ''} />
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
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar estado" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                             {statuses.map(status => (
                                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                            ))}
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
                                <Input placeholder="Ej: Clase B" {...field} value={field.value ?? ''} />
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
                        <Button type="button" size="sm" variant="outline" onClick={() => appendWorkClothing({ id: crypto.randomUUID(), item: '', size: '', quantity: 1, deliveryDate: '', expirationDate: '' })} disabled={disabled}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Añadir Fila
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="w-[100px]">Talla</TableHead>
                                <TableHead className="w-[120px]">Cantidad</TableHead>
                                <TableHead className="w-[200px]">Fecha de Entrega</TableHead>
                                <TableHead className="w-[200px]">Fecha de Caducidad</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workClothingFields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell><FormField control={form.control} name={`workClothing.${index}.item`} render={({ field }) => <Input {...field} placeholder="Pantalón Corporativo"/>} /></TableCell>
                                    <TableCell><FormField control={form.control} name={`workClothing.${index}.size`} render={({ field }) => <Input {...field} placeholder="M"/>} /></TableCell>
                                    <TableCell><FormField control={form.control} name={`workClothing.${index}.quantity`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                                    <TableCell>
                                        <FormField 
                                            control={form.control} 
                                            name={`workClothing.${index}.deliveryDate`} 
                                            render={({ field }) => renderDateField(field, index, 'deliveryDate', 'workClothing')} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField 
                                            control={form.control} 
                                            name={`workClothing.${index}.expirationDate`} 
                                            render={({ field }) => renderDateField(field, index, 'expirationDate', 'workClothing')} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeWorkClothing(index)} disabled={disabled}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Equipo de Protección Personal (EPP)</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => appendEpp({ id: crypto.randomUUID(), item: '', size: '', quantity: 1, deliveryDate: '', expirationDate: '' })} disabled={disabled}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Añadir Fila
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="w-[100px]">Talla</TableHead>
                                <TableHead className="w-[120px]">Cantidad</TableHead>
                                <TableHead className="w-[200px]">Fecha de Entrega</TableHead>
                                <TableHead className="w-[200px]">Fecha de Caducidad</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eppFields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell><FormField control={form.control} name={`epp.${index}.item`} render={({ field }) => <Input {...field} placeholder="Casco de seguridad"/>} /></TableCell>
                                    <TableCell><FormField control={form.control} name={`epp.${index}.size`} render={({ field }) => <Input {...field} placeholder="M"/>} /></TableCell>
                                    <TableCell><FormField control={form.control} name={`epp.${index}.quantity`} render={({ field }) => <Input type="number" {...field} />} /></TableCell>
                                    <TableCell>
                                        <FormField 
                                            control={form.control} 
                                            name={`epp.${index}.deliveryDate`} 
                                            render={({ field }) => renderDateField(field, index, 'deliveryDate', 'epp')} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField 
                                            control={form.control} 
                                            name={`epp.${index}.expirationDate`} 
                                            render={({ field }) => renderDateField(field, index, 'expirationDate', 'epp')} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeEpp(index)} disabled={disabled}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Certificados</CardTitle>
                        <Button type="button" size="sm" variant="outline" onClick={() => appendCertification({ id: crypto.randomUUID(), name: '', issuingOrganization: '', issueDate: '', expirationDate: '' })} disabled={disabled}>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Añadir Fila
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Certificado</TableHead>
                                <TableHead>Organización Emisora</TableHead>
                                <TableHead className="w-[200px]">Fecha de Emisión</TableHead>
                                <TableHead className="w-[200px]">Fecha de Caducidad</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {certificationFields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell><FormField control={form.control} name={`certifications.${index}.name`} render={({ field }) => <Input {...field} placeholder="Certificación SEC"/>} /></TableCell>
                                    <TableCell><FormField control={form.control} name={`certifications.${index}.issuingOrganization`} render={({ field }) => <Input {...field} placeholder="SEC"/>} /></TableCell>
                                    <TableCell>
                                        <FormField 
                                            control={form.control} 
                                            name={`certifications.${index}.issueDate`} 
                                            render={({ field }) => renderDateField(field, index, 'issueDate', 'certifications')} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <FormField 
                                            control={form.control} 
                                            name={`certifications.${index}.expirationDate`} 
                                            render={({ field }) => renderDateField(field, index, 'expirationDate', 'certifications')} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeCertification(index)} disabled={disabled}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
          </fieldset>

          {!disabled && (
              <div className="flex justify-end gap-2">
                  <Button variant="outline" asChild><Link href="/collaborators">Cancelar</Link></Button>
                  <Button type="submit">Guardar Cambios</Button>
              </div>
          )}
        </form>
    </Form>
  );
}
