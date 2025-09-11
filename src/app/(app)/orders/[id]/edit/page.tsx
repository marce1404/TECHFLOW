

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowRight, Trash2, PlusCircle, Send, Info, FileClock } from "lucide-react";
import { cn, normalizeString } from "@/lib/utils";
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
import { useForm, FormProvider, useFieldArray, Controller } from "react-hook-form";
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
import { SendToInvoiceDialog } from "@/components/orders/send-to-invoice-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";


export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { getOrder, updateOrder, otCategories, services, collaborators, ganttCharts, otStatuses, vehicles, promptToCloseOrder, deleteOrder, loading: contextLoading } = useWorkOrders();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const orderId = params.id as string;
  const [initialOrder, setInitialOrder] = React.useState<WorkOrder | null | undefined>(undefined);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = React.useState(false);
  const [isFormReady, setIsFormReady] = React.useState(false);

  
  const methods = useForm<WorkOrder>();

  const { fields: invoiceFields, append: appendInvoice, remove: removeInvoice } = useFieldArray({
      control: methods.control,
      name: "invoices",
  });

  const [newInvoiceNumber, setNewInvoiceNumber] = React.useState('');
  const [newInvoiceDate, setNewInvoiceDate] = React.useState<Date | undefined>(new Date());
  const [newInvoiceAmount, setNewInvoiceAmount] = React.useState(0);
  
  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';
  
  const watchNetPrice = methods.watch('netPrice');
  const watchedInvoices = methods.watch('invoices');
  const watchedInvoiceRequests = methods.watch('invoiceRequestDates');

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
  
  const serviceOptions = services.map(s => ({value: s.name, label: s.name}));
  const statusOptions = otStatuses.map(s => ({value: s.name, label: s.name}));
  const priorityOptions = [{value: 'Baja', label: 'Baja'}, {value: 'Media', label: 'Media'}, {value: 'Alta', label: 'Alta'}];

  const startDate = methods.watch('date') ? new Date(methods.watch('date').replace(/-/g, '/')) : undefined;
  const endDate = methods.watch('endDate') ? new Date(methods.watch('endDate')!.replace(/-/g, '/')) : undefined;

  const totalPrice = watchNetPrice ? Math.round(watchNetPrice * 1.19) : 0;
  const ivaPrice = watchNetPrice ? Math.round(watchNetPrice * 0.19) : 0;
  
  const totalInvoicedNet = React.useMemo(() => {
    return (watchedInvoices || []).reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [watchedInvoices]);
  
  const totalInvoicedGross = Math.round(totalInvoicedNet * 1.19);
  const balance = (watchNetPrice || 0) - totalInvoicedNet;

  const assignedGantt = ganttCharts.find(g => g.assignedOT === methods.watch('ot_number'));
  const isGanttAssigned = !!assignedGantt;
  
  React.useEffect(() => {
    if (!contextLoading) {
      const foundOrder = getOrder(orderId);
      setInitialOrder(foundOrder);
    }
  }, [orderId, contextLoading, getOrder]);

  React.useEffect(() => {
    if (initialOrder && services.length > 0 && otStatuses.length > 0 && collaborators.length > 0) {
        
        const findCaseInsensitive = (value: string | undefined, options: {value: string, label: string}[]) => {
            if (!value) return '';
            const normalizedValue = normalizeString(value);
            const found = options.find(opt => normalizeString(opt.value) === normalizedValue);
            return found ? found.value : '';
        };
        
        const defaults = {
            ...initialOrder,
            description: initialOrder.description || '',
            ot_number: initialOrder.ot_number || '',
            client: initialOrder.client || '',
            rut: initialOrder.rut || '',
            service: findCaseInsensitive(initialOrder.service, serviceOptions),
            date: initialOrder.date || '',
            endDate: initialOrder.endDate || '',
            startTime: initialOrder.startTime || '09:00',
            endTime: initialOrder.endTime || '18:00',
            technicians: Array.isArray(initialOrder.technicians) ? initialOrder.technicians : [],
            vehicles: Array.isArray(initialOrder.vehicles) ? initialOrder.vehicles : [],
            rentedVehicle: initialOrder.rentedVehicle || '',
            notes: initialOrder.notes || '',
            status: findCaseInsensitive(initialOrder.status, statusOptions),
            priority: findCaseInsensitive(initialOrder.priority, priorityOptions) as WorkOrder['priority'] || 'Baja',
            netPrice: initialOrder.netPrice || 0,
            ocNumber: initialOrder.ocNumber || '',
            saleNumber: initialOrder.saleNumber || '',
            hesEmMigo: initialOrder.hesEmMigo || '',
            assigned: Array.isArray(initialOrder.assigned) ? initialOrder.assigned : [],
            comercial: findCaseInsensitive(initialOrder.comercial, vendors),
            manualProgress: initialOrder.manualProgress || 0,
            invoices: initialOrder.invoices || [],
            invoiceRequestDates: initialOrder.invoiceRequestDates || [],
        };
        methods.reset(defaults);
        setIsFormReady(true);
    }
  }, [initialOrder, services, otStatuses, collaborators, methods]);
  
  if (contextLoading || !isFormReady || !initialOrder) {
      return <div>Cargando orden de trabajo...</div>
  }

  if (initialOrder === null) {
      return <div>Orden de trabajo no encontrada.</div>
  }
  
  const handleStatusChange = (value: WorkOrder['status']) => {
    if (normalizeString(value) === 'cerrada') {
        promptToCloseOrder(initialOrder);
    } else {
        methods.setValue('status', value);
    }
  };

  const handleUpdateOrder = async (data: WorkOrder) => {
    if (!canEdit || !initialOrder) return;
    
    // Merge original data with form data to prevent data loss
    const finalData = { ...initialOrder, ...data };

    await updateOrder(finalData.id, finalData);

    toast({
      title: "Orden de Trabajo Actualizada",
      description: `La OT "${finalData.description}" ha sido actualizada.`,
      duration: 2000,
    });
    
    const isClosed = normalizeString(finalData.status) === 'cerrada';
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

  const formatCurrency = (num: number): string => {
    return isNaN(num) ? '' : new Intl.NumberFormat('es-CL').format(num);
  };

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

  return (
    <>
    <FormProvider {...methods}>
    <TooltipProvider>
    <Form {...methods}>
    <form onSubmit={methods.handleSubmit(handleUpdateOrder)} className="space-y-6">
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex items-end gap-4">
            <h1 className="text-2xl font-headline font-bold tracking-tight">
                Editar Orden de Trabajo
            </h1>
        </div>
        {!canEdit && <p className="text-sm text-destructive font-medium">Modo de solo lectura.</p>}
      </div>

      <Card>
        <fieldset disabled={!canEdit}>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ot-name">Nombre de OT *</Label>
                  <Controller
                    control={methods.control}
                    name="description"
                    render={({ field }) => (
                      <Input
                        id="ot-name"
                        {...field}
                        placeholder="Escribe el nombre o descripción de la OT..."
                      />
                    )}
                   />
                </div>
                 <div>
                  <Label htmlFor="ot_number">Número de OT *</Label>
                  <Controller
                      control={methods.control}
                      name="ot_number"
                      render={({ field }) => (
                          <Input
                            id="ot_number"
                            {...field}
                            placeholder="Ej: OT-1234"
                          />
                      )}
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Left Column */}
                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="client">Cliente</Label>
                            <Controller
                                control={methods.control}
                                name="client"
                                render={({ field }) => (
                                    <Input 
                                        id="client" 
                                        {...field}
                                        placeholder="Escribe el nombre del cliente..." 
                                    />
                                )}
                            />
                        </div>
                         <div>
                            <Label htmlFor="rut">RUT Cliente</Label>
                            <Controller
                                control={methods.control}
                                name="rut"
                                render={({ field }) => (
                                    <Input 
                                        id="rut" 
                                        {...field}
                                        placeholder="Ej: 12.345.678-9" 
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <FormField
                        control={methods.control}
                        name="service"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Servicio</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger id="service">
                                            <SelectValue placeholder="Elegir servicio..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {serviceOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />


                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-date">Fecha Creación (OT)</Label>
                            <Controller
                                control={methods.control}
                                name="date"
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(new Date(field.value.replace(/-/g, '/')), "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value.replace(/-/g, '/')) : undefined}
                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                            initialFocus
                                            locale={es}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="end-date">Fecha T. Posible</Label>
                             <Controller
                                control={methods.control}
                                name="endDate"
                                render={({ field }) => (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(new Date(field.value.replace(/-/g, '/')), "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                            mode="single"
                                            selected={field.value ? new Date(field.value.replace(/-/g, '/')) : undefined}
                                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined)}
                                            initialFocus
                                            locale={es}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                )}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="start-time">Hora Inicio</Label>
                            <Controller
                                control={methods.control}
                                name="startTime"
                                render={({ field }) => (
                                    <Input id="start-time" type="time" {...field} />
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="end-time">Hora Término</Label>
                            <Controller
                                control={methods.control}
                                name="endTime"
                                render={({ field }) => (
                                    <Input id="end-time" type="time" {...field} />
                                )}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <Label>Técnicos Asignados</Label>
                        <Controller
                            control={methods.control}
                            name="technicians"
                            render={({ field }) => (
                                <MultiSelect
                                    options={technicians}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar técnicos..."
                                />
                            )}
                        />
                    </div>
                    
                    <div>
                        <Label>Vehículos Asignados</Label>
                         <Controller
                            control={methods.control}
                            name="vehicles"
                            render={({ field }) => (
                                <MultiSelect
                                    options={vehicleOptions}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar vehículos..."
                                />
                            )}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="rented-vehicle">Vehículo Arrendado (Opcional)</Label>
                        <Controller
                            control={methods.control}
                            name="rentedVehicle"
                            render={({ field }) => (
                                <Input 
                                    id="rented-vehicle" 
                                     {...field}
                                />
                            )}
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Descripción / Notas Adicionales</Label>
                        <Controller
                            control={methods.control}
                            name="notes"
                            render={({ field }) => (
                                <Textarea 
                                  id="notes" 
                                  {...field}
                                  placeholder="Añadir descripción detallada, materiales, notas..." 
                                  rows={5} 
                                />
                            )}
                        />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={methods.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <Select onValueChange={(value) => handleStatusChange(value as WorkOrder['status'])} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger id="status">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {statusOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={methods.control}
                            name="priority"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prioridad</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger id="priority">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {priorityOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                            <Controller
                                control={methods.control}
                                name="ocNumber"
                                render={({ field }) => (
                                    <Input 
                                        id="oc-number"
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                        <div>
                            <Label htmlFor="sale-number">Nº Venta</Label>
                            <Controller
                                control={methods.control}
                                name="saleNumber"
                                render={({ field }) => (
                                    <Input 
                                        id="sale-number" 
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                    </div>
                     <div>
                        <Label htmlFor="hes-em-migo">HES / EM / MIGO</Label>
                        <Controller
                            control={methods.control}
                            name="hesEmMigo"
                            render={({ field }) => (
                                <Input 
                                    id="hes-em-migo" 
                                    {...field}
                                />
                            )}
                        />
                    </div>


                    <div>
                        <Label>Encargados</Label>
                         <Controller
                            control={methods.control}
                            name="assigned"
                            render={({ field }) => (
                                <MultiSelect
                                    options={supervisors}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Seleccionar encargados..."
                                />
                            )}
                        />
                    </div>

                    <FormField
                        control={methods.control}
                        name="comercial"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Comercial</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger id="vendor">
                                            <SelectValue placeholder="Seleccionar comercial" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {vendors.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
                            <Controller
                                control={methods.control}
                                name="manualProgress"
                                render={({ field }) => (
                                    <Slider
                                        value={[field.value || 0]}
                                        onValueChange={(value) => field.onChange(value[0])}
                                        max={100}
                                        step={5}
                                    />
                                )}
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
                 <div className="md:col-span-1 flex justify-end">
                    <Button onClick={handleAddInvoice} size="sm" type="button">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Agregar
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

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
              </fieldset>
              
              <Separator className="my-6"/>

                <div>
                    <h3 className="text-md font-semibold mb-2 flex items-center gap-2"><FileClock className="h-5 w-5 text-primary"/>Historial de Solicitudes de Facturación</h3>
                    {(watchedInvoiceRequests && watchedInvoiceRequests.length > 0) ? (
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            {watchedInvoiceRequests.map((date, index) => (
                                <li key={index} className="flex items-center gap-2 p-2 border-b">
                                    <Send className="h-4 w-4"/>
                                    <span>Solicitud enviada el: {format(new Date(date), 'dd/MM/yyyy \'a las\' HH:mm', { locale: es })}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No se han enviado solicitudes de facturación.</p>
                    )}
                </div>

              <Separator className="my-6"/>
              
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
          </CardContent>
      </Card>


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
                  <Button variant="outline" type="button" onClick={() => setIsInvoiceDialogOpen(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar a Facturar
                  </Button>
                  <Button type="submit">Guardar Cambios</Button>
              </div>
          </div>
      )}
    </div>
    </form>
    </Form>
    </TooltipProvider>
    </FormProvider>
    <SendToInvoiceDialog
        open={isInvoiceDialogOpen}
        onOpenChange={setIsInvoiceDialogOpen}
        order={initialOrder}
      />
    </>
  );
}
