
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import type { WorkOrder, Invoice } from "@/lib/types";
import { useWorkOrders } from "@/context/work-orders-context";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/auth-context";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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


export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { getOrder, updateOrder, otCategories, services, collaborators, ganttCharts, otStatuses, vehicles, promptToCloseOrder, deleteOrder } = useWorkOrders();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const orderId = params.id as string;
  
  const methods = useForm<WorkOrder>();
  const { fields: invoiceFields, append: appendInvoice, remove: removeInvoice } = useFieldArray({
      control: methods.control,
      name: "invoices",
  });

  const [newInvoiceNumber, setNewInvoiceNumber] = React.useState('');
  const [newInvoiceDate, setNewInvoiceDate] = React.useState<Date | undefined>(new Date());
  const [newInvoiceAmount, setNewInvoiceAmount] = React.useState(0);
  
  const initialOrder = React.useMemo(() => getOrder(orderId), [orderId, getOrder]);
  
  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';
  
  const watchNetPrice = methods.watch('netPrice');
  const watchedInvoices = methods.watch('invoices');

  React.useEffect(() => {
    if (initialOrder) {
      // Data migration logic
      let finalOrderData = { ...initialOrder };
      if (!initialOrder.invoices && initialOrder.invoiceNumber) {
        finalOrderData.invoices = [{
          id: crypto.randomUUID(),
          number: initialOrder.invoiceNumber,
          amount: initialOrder.netPrice || 0,
          date: initialOrder.date,
        }];
      }
      methods.reset(finalOrderData);
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
  
  const handleDelete = async () => {
    if (!canEdit || !initialOrder) return;
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

  const formatCurrency = (num: number): string => {
    return isNaN(num) ? '' : new Intl.NumberFormat('es-CL').format(num);
  };

  const startDate = methods.watch('date') ? new Date(methods.watch('date').replace(/-/g, '/')) : undefined;
  const endDate = methods.watch('endDate') ? new Date(methods.watch('endDate')!.replace(/-/g, '/')) : undefined;

  const totalPrice = watchNetPrice ? Math.round(watchNetPrice * 1.19) : 0;
  const ivaPrice = watchNetPrice ? Math.round(watchNetPrice * 0.19) : 0;
  
  const totalInvoicedNet = React.useMemo(() => {
    return (watchedInvoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [watchedInvoices]);
  
  const totalInvoicedGross = Math.round(totalInvoicedNet * 1.19);
  const balance = (watchNetPrice || 0) - totalInvoicedNet;

  const handleAddInvoice = () => {
    if (!newInvoiceNumber || !newInvoiceDate || newInvoiceAmount <= 0) {
        toast({ variant: 'destructive', title: 'Datos de Factura Incompletos', description: 'Por favor, complete todos los campos de la factura.'});
        return;
    }
    const newInvoice: Invoice = {
        id: crypto.randomUUID(),
        number: newInvoiceNumber,
        date: format(newInvoiceDate, 'yyyy-MM-dd'),
        amount: newInvoiceAmount,
    };
    appendInvoice(newInvoice);
    setNewInvoiceNumber('');
    setNewInvoiceDate(new Date());
    setNewInvoiceAmount(0);
  };


  const currentPrefix = (methods.watch('ot_number') || '').split('-')[0];
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
                                <SelectItem key={service.id} value={service.name.toLowerCase()}>{service.name.toUpperCase()}</SelectItem>
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
                                        <SelectItem key={status.id} value={status.name}>{status.name.toUpperCase()}</SelectItem>
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
                    
                     <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="net-price">Precio Neto</Label>
                            <Input 
                                id="net-price" 
                                type="text" 
                                value={formatCurrency(watchNetPrice || 0)}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\./g, '');
                                    const numericValue = parseInt(rawValue, 10);
                                    methods.setValue('netPrice', isNaN(numericValue) ? 0 : numericValue);
                                }}
                            />
                        </div>
                         <div>
                            <Label htmlFor="iva-price">IVA (19%)</Label>
                            <Input 
                              id="iva-price" 
                              type="text" 
                              value={formatCurrency(ivaPrice)}
                              readOnly 
                              className="bg-muted"
                            />
                        </div>
                        <div>
                            <Label htmlFor="total-price">Precio Total</Label>
                            <Input 
                              id="total-price" 
                              type="text" 
                              value={formatCurrency(totalPrice)}
                              readOnly 
                              className="bg_muted"
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
      
        <Card>
            <CardHeader>
              <CardTitle>Gestión de Facturas</CardTitle>
            </CardHeader>
            <CardContent>
                <fieldset disabled={!canEdit}>
                    <div className="rounded-md border mb-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número de Factura</TableHead>
                                    <TableHead className="w-[180px]">Fecha</TableHead>
                                    <TableHead className="w-[150px] text-right">Monto (Neto)</TableHead>
                                    <TableHead className="w-[150px] text-right">Total (IVA Incl.)</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoiceFields.map((field, index) => (
                                    <TableRow key={field.id}>
                                        <TableCell>{methods.watch(`invoices.${index}.number`)}</TableCell>
                                        <TableCell>{format(new Date(methods.watch(`invoices.${index}.date`).replace(/-/g, '/')), "PPP", { locale: es })}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(methods.watch(`invoices.${index}.amount`))}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(Math.round(methods.watch(`invoices.${index}.amount`) * 1.19))}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => removeInvoice(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {invoiceFields.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            No se han añadido facturas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-4 text-sm font-medium">
                        <div className="p-2 border rounded-md">
                            <p className="text-muted-foreground">Total Facturado (Neto)</p>
                            <p className="text-lg font-bold">{formatCurrency(totalInvoicedNet)}</p>
                        </div>
                        <div className="p-2 border rounded-md">
                            <p className="text-muted-foreground">Total Facturado (IVA Incl.)</p>
                            <p className="text-lg font-bold">{formatCurrency(totalInvoicedGross)}</p>
                        </div>
                        <div className="p-2 border rounded-md">
                            <p className="text-muted-foreground">Precio OT (Neto)</p>
                            <p className="text-lg font-bold">{formatCurrency(watchNetPrice || 0)}</p>
                        </div>
                        <div className={cn("p-2 border rounded-md", balance < 0 ? "text-destructive" : "")}>
                            <p className="text-muted-foreground">Saldo Pendiente (Neto)</p>
                            <p className="text-lg font-bold">{formatCurrency(balance)}</p>
                        </div>
                    </div>
                </fieldset>
            </CardContent>
        </Card>

        {canEdit && (
        <Card>
            <CardHeader>
                <CardTitle>Añadir Nueva Factura</CardTitle>
                <CardDescription>Completa los datos y presiona "Agregar" para añadir una factura a la lista.</CardDescription>
            </CardHeader>
             <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                    <Label htmlFor="new-invoice-number">Número de Factura</Label>
                    <Input id="new-invoice-number" value={newInvoiceNumber} onChange={e => setNewInvoiceNumber(e.target.value)} />
                </div>
                 <div className="md:col-span-1">
                    <Label htmlFor="new-invoice-date">Fecha</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newInvoiceDate ? format(newInvoiceDate, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={newInvoiceDate} onSelect={setNewInvoiceDate} initialFocus locale={es} />
                        </PopoverContent>
                    </Popover>
                </div>
                 <div className="md:col-span-1">
                    <Label htmlFor="new-invoice-amount">Monto (Neto)</Label>
                    <Input 
                        id="new-invoice-amount" 
                        type="text" 
                        className="text-right" 
                        value={formatCurrency(newInvoiceAmount)} 
                        onChange={(e) => {
                            const rawValue = e.target.value.replace(/\./g, '');
                            const numericValue = parseInt(rawValue, 10);
                            setNewInvoiceAmount(isNaN(numericValue) ? 0 : numericValue);
                        }}
                    />
                </div>
                 <div className="md:col-span-1">
                    <Button onClick={handleAddInvoice} className="w-full" type="button">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Agregar Factura a la Lista
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}


      {canEdit && (
          <div className="flex justify-between items-center mt-8">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" type="button">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar OT
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción es permanente y no se puede deshacer. Se eliminará la orden de trabajo <span className="font-bold">{initialOrder?.ot_number}</span>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
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
