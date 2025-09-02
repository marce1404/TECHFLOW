

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowRight, Trash2, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import * as React from "react";
import Link from 'next/link';
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import type { WorkOrder } from "@/lib/types";
import { useWorkOrders } from "@/context/work-orders-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/auth-context";
import { useFieldArray, useForm, FormProvider } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { getOrder, updateOrder, otCategories, services, collaborators, ganttCharts, otStatuses, vehicles, promptToCloseOrder, deleteOrder } = useWorkOrders();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const orderId = params.id as string;
  const initialOrder = React.useMemo(() => getOrder(orderId), [orderId, getOrder]);
  
  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

  const methods = useForm<WorkOrder>({
    defaultValues: initialOrder
  });

  const { fields: invoiceFields, append: appendInvoice, remove: removeInvoice } = useFieldArray({
    control: methods.control,
    name: "invoices",
  });
  
  const watchInvoices = methods.watch('invoices');
  const watchNetPrice = methods.watch('netPrice');

  React.useEffect(() => {
    if (initialOrder) {
      methods.reset(initialOrder);
    }
  }, [initialOrder, methods]);

  if (!initialOrder) {
      return <div>Cargando orden de trabajo...</div>
  }
  
  const handleStatusChange = (value: WorkOrder['status']) => {
    if (value.toLowerCase() === 'cerrada') {
        promptToCloseOrder(initialOrder);
    } else {
        methods.setValue('status', value);
    }
  };

  const handleUpdateOrder = async (data: WorkOrder) => {
    if (!canEdit) return;

    await updateOrder(data.id, data);

    toast({
      title: "Orden de Trabajo Actualizada",
      description: `La OT "${data.description}" ha sido actualizada.`,
      duration: 2000,
    });
    
    const isClosed = data.status.toLowerCase() === 'cerrada';
    if (isClosed) {
      router.push(`/orders/history`);
    } else {
      router.push(`/orders`);
    }
  };
  
  const handleDeleteOrder = async () => {
    if (!canEdit) return;
    await deleteOrder(initialOrder.id);
    toast({
        title: "Orden Eliminada",
        description: `La OT "${initialOrder.description}" ha sido eliminada.`,
        duration: 2000,
    });
    router.push('/orders');
  }

  const technicians = collaborators
    .filter(c => c.role === 'Técnico')
    .map(c => ({ value: c.name, label: c.name }));

  const supervisors = collaborators
    .filter(c => ['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role))
    .map(c => ({ value: c.name, label: c.name }));

  const vendors = collaborators
    .filter(c => c.role === 'Comercial')
    .map(c => ({ value: c.name, label: c.name }));
  
  const vehicleOptions = vehicles.map(v => ({
    value: v.plate,
    label: `${v.model} (${v.plate})`,
  }));

  const formatNumber = (num: number): string => {
    return isNaN(num) ? '' : new Intl.NumberFormat('es-CL').format(num);
  };

  // By replacing hyphens with slashes, we ensure the date is parsed in the local time zone,
  // preventing hydration mismatches between server and client.
  const startDate = methods.watch('date') ? new Date(methods.watch('date').replace(/-/g, '/')) : undefined;
  const endDate = methods.watch('endDate') ? new Date(methods.watch('endDate')!.replace(/-/g, '/')) : undefined;

  const totalPrice = watchNetPrice ? Math.round(watchNetPrice * 1.19) : 0;
  
  const totalInvoiced = React.useMemo(() => {
    return (watchInvoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [watchInvoices]);
  
  const balance = watchNetPrice - totalInvoiced;

  const currentPrefix = methods.watch('ot_number').split('-')[0];
  const assignedGantt = ganttCharts.find(g => g.assignedOT === methods.watch('ot_number'));
  const isGanttAssigned = !!assignedGantt;

  return (
    <FormProvider {...methods}>
    <form onSubmit={methods.handleSubmit(handleUpdateOrder)} className="space-y-6">
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-headline font-bold tracking-tight">
            Editar Orden de Trabajo
        </h1>
        {!canEdit && <p className="text-sm text-destructive font-medium">Modo de solo lectura.</p>}
      </div>

      <Card>
        <fieldset disabled={!canEdit}>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="ot-name">Nombre de OT *</Label>
              <Input
                id="ot-name"
                {...methods.register('description')}
                placeholder="Escribe el nombre o descripción de la OT..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="ot-category">Categoría OT *</Label>
                        <Select
                          value={currentPrefix}
                          onValueChange={(value) => {
                            const currentNumber = methods.getValues('ot_number').split('-')[1];
                            methods.setValue('ot_number', `${value}-${currentNumber}`);
                          }}
                        >
                        <SelectTrigger id="ot-category">
                            <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            {otCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.prefix}>{cat.name} ({cat.prefix})</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="client">Cliente</Label>
                            <Input 
                                id="client" 
                                {...methods.register('client')}
                                placeholder="Escribe el nombre del cliente..." 
                            />
                        </div>
                         <div>
                            <Label htmlFor="rut">RUT Cliente</Label>
                            <Input 
                                id="rut" 
                                {...methods.register('rut')}
                                placeholder="Ej: 12.345.678-9" 
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="service">Servicio</Label>
                        <Select 
                           value={methods.watch('service')}
                           onValueChange={(value) => methods.setValue('service', value)}
                        >
                        <SelectTrigger id="service">
                            <SelectValue placeholder="Elegir servicio..." />
                        </SelectTrigger>
                        <SelectContent>
                            {services.map(service => (
                                <SelectItem key={service.id} value={service.name.toLowerCase()}>{service.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-date">Fecha Inicio</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !startDate && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => methods.setValue('date', date ? format(date, 'yyyy-MM-dd') : '')}
                                    initialFocus
                                    locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="end-date">Fecha T. Posible</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={(date) => methods.setValue('endDate', date ? format(date, 'yyyy-MM-dd') : undefined)}
                                    initialFocus
                                    locale={es}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    
                    <div>
                        <Label>Técnicos Asignados</Label>
                        <MultiSelect
                            options={technicians}
                            selected={methods.watch('technicians') || []}
                            onChange={(selected) => methods.setValue('technicians', selected)}
                            placeholder="Seleccionar técnicos..."
                        />
                    </div>
                    
                    <div>
                        <Label>Vehículos Asignados</Label>
                         <MultiSelect
                            options={vehicleOptions}
                            selected={methods.watch('vehicles') || []}
                            onChange={(selected) => methods.setValue('vehicles', selected)}
                            placeholder="Seleccionar vehículos..."
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="rented-vehicle">Vehículo Arrendado (Opcional)</Label>
                        <Input 
                            id="rented-vehicle" 
                             {...methods.register('rentedVehicle')}
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Descripción / Notas Adicionales</Label>
                        <Textarea 
                          id="notes" 
                          {...methods.register('notes')}
                          placeholder="Añadir descripción detallada, materiales, notas..." 
                          rows={5} 
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Estado</Label>
                            <Select 
                              value={methods.watch('status')}
                              onValueChange={(value) => handleStatusChange(value as WorkOrder['status'])}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {otStatuses.map(status => (
                                        <SelectItem key={status.id} value={status.name}>{status.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="priority">Prioridad</Label>
                            <Select 
                              value={methods.watch('priority')}
                              onValueChange={(value) => methods.setValue('priority', value as WorkOrder['priority'])}
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Baja">Baja</SelectItem>
                                    <SelectItem value="Media">Media</SelectItem>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="net-price">Precio Neto</Label>
                            <Input 
                                id="net-price" 
                                type="text" 
                                value={formatNumber(watchNetPrice)}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\./g, '');
                                    const numericValue = parseInt(rawValue, 10);
                                    methods.setValue('netPrice', isNaN(numericValue) ? 0 : numericValue);
                                }}
                            />
                        </div>
                        <div>
                            <Label htmlFor="total-price">Precio Total (IVA Incl.)</Label>
                            <Input 
                              id="total-price" 
                              type="text" 
                              value={formatNumber(totalPrice)}
                              readOnly 
                              className="bg-muted"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="oc-number">OC</Label>
                            <Input 
                                id="oc-number"
                                {...methods.register('ocNumber')}
                            />
                        </div>
                        <div>
                            <Label htmlFor="sale-number">Nº Venta</Label>
                            <Input 
                                id="sale-number" 
                                {...methods.register('saleNumber')}
                            />
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="hes-em-migo">HES / EM / MIGO</Label>
                        <Input 
                            id="hes-em-migo" 
                            {...methods.register('hesEmMigo')}
                        />
                    </div>


                    <div>
                        <Label>Encargados</Label>
                        <MultiSelect
                            options={supervisors}
                            selected={methods.watch('assigned') || []}
                            onChange={(selected) => methods.setValue('assigned', selected)}
                            placeholder="Seleccionar encargados..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="vendor">Comercial</Label>
                        <Select
                          value={methods.watch('comercial')}
                          onValueChange={(value) => methods.setValue('comercial', value)}
                        >
                            <SelectTrigger id="vendor">
                                <SelectValue placeholder="Seleccionar comercial" />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => <SelectItem key={v.value} value={v.label}>{v.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                     {isGanttAssigned ? (
                        <div>
                            <Label>Carta Gantt Asignada</Label>
                            <div className="flex items-center gap-2">
                                <Input value={assignedGantt.name} readOnly className="bg-muted flex-1"/>
                                <Button asChild variant="outline" size="icon">
                                    <Link href={`/gantt/${assignedGantt.id}/edit`}>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Label>Avance Manual ({methods.watch('manualProgress') || 0}%)</Label>
                            <Slider
                                value={[methods.watch('manualProgress') || 0]}
                                onValueChange={(value) => methods.setValue('manualProgress', value[0])}
                                max={100}
                                step={5}
                            />
                        </div>
                    )}
                    
                    {methods.watch('status') === 'Cerrada' && endDate && (
                      <div>
                        <Label>Fecha de Cierre</Label>
                        <Input value={format(endDate, "PPP", { locale: es })} readOnly className="bg-muted"/>
                      </div>
                    )}
                </div>
            </div>
            </div>
            </CardContent>
            </fieldset>
      </Card>
      
      {/* Invoice Management Section */}
      <Card>
          <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gestión de Facturas</CardTitle>
                 <Button type="button" size="sm" variant="outline" disabled={!canEdit} onClick={() => appendInvoice({ id: crypto.randomUUID(), number: '', date: format(new Date(), 'yyyy-MM-dd'), amount: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Añadir Factura
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <fieldset disabled={!canEdit}>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Número de Factura</TableHead>
                                <TableHead className="w-[200px]">Fecha</TableHead>
                                <TableHead className="w-[200px]">Monto (Neto)</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoiceFields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell>
                                        <Input {...methods.register(`invoices.${index}.number`)} placeholder="Ej: 12345"/>
                                    </TableCell>
                                    <TableCell>
                                         <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                     {methods.watch(`invoices.${index}.date`) ? format(new Date(methods.watch(`invoices.${index}.date`).replace(/-/g, '/')), "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={new Date(methods.watch(`invoices.${index}.date`).replace(/-/g, '/'))}
                                                    onSelect={(date) => methods.setValue(`invoices.${index}.date`, date ? format(date, 'yyyy-MM-dd') : '')}
                                                    initialFocus
                                                    locale={es}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="text" 
                                            value={formatNumber(methods.watch(`invoices.${index}.amount`))}
                                            onChange={(e) => {
                                                const rawValue = e.target.value.replace(/\./g, '');
                                                const numericValue = parseInt(rawValue, 10);
                                                methods.setValue(`invoices.${index}.amount`, isNaN(numericValue) ? 0 : numericValue);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => removeInvoice(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {invoiceFields.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No se han añadido facturas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 text-sm font-medium">
                    <div className="p-2 border rounded-md">
                        <p className="text-muted-foreground">Total Facturado (Neto)</p>
                        <p className="text-lg font-bold">{formatNumber(totalInvoiced)}</p>
                    </div>
                     <div className="p-2 border rounded-md">
                        <p className="text-muted-foreground">Precio OT (Neto)</p>
                        <p className="text-lg font-bold">{formatNumber(watchNetPrice)}</p>
                    </div>
                     <div className={cn("p-2 border rounded-md", balance < 0 ? "text-destructive" : "")}>
                        <p className="text-muted-foreground">Saldo Pendiente</p>
                        <p className="text-lg font-bold">{formatNumber(balance)}</p>
                    </div>
                </div>
            </fieldset>
          </CardContent>
      </Card>


      {canEdit && (
          <div className="flex justify-between items-center mt-8">
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar OT
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Está seguro de que desea eliminar esta Orden de Trabajo?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción es permanente y no se puede deshacer. Se eliminará la OT "{initialOrder.ot_number} - {initialOrder.description}".
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive hover:bg-destructive/90">
                              Sí, eliminar
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              <div className="flex gap-2">
                  <Button variant="outline" asChild><Link href="/orders">Cancelar</Link></Button>
                  <Button type="submit">Guardar Cambios</Button>
              </div>
          </div>
      )}
    </div>
    </form>
    </FormProvider>
  );
}
