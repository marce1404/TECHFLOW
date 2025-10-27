'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, PlusCircle, Trash2, Loader2 } from "lucide-react";
import { cn, normalizeString } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import * as React from "react";
import Link from 'next/link';
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { useWorkOrders } from "@/context/work-orders-context";
import type { WorkOrder, Invoice, NewOrderNotification } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/auth-context";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";


export default function NewOrderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { workOrders, otCategories, services, addOrder, getNextOtNumber, collaborators, otStatuses, vehicles, getLastOtNumber } = useWorkOrders();
    const { userProfile } = useAuth();
    
    const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const [description, setDescription] = React.useState('');
    const [categoryPrefix, setCategoryPrefix] = React.useState('');
    const [createdAt, setCreatedAt] = React.useState<Date | undefined>(new Date());
    const [client, setClient] = React.useState('');
    const [rut, setRut] = React.useState('');
    const [service, setService] = React.useState('');
    const [startDate, setStartDate] = React.useState<Date>();
    const [endDate, setEndDate] = React.useState<Date>();
    const [startTime, setStartTime] = React.useState('09:00');
    const [endTime, setEndTime] = React.useState('18:00');
    const [selectedTechnicians, setSelectedTechnicians] = React.useState<string[]>([]);
    const [selectedVehicles, setSelectedVehicles] = React.useState<string[]>([]);
    const [rentedVehicle, setRentedVehicle] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [status, setStatus] = React.useState<WorkOrder['status']>('Por Iniciar');
    const [priority, setPriority] = React.useState<WorkOrder['priority']>('Baja');
    const [netPrice, setNetPrice] = React.useState(0);
    const [ocNumber, setOcNumber] = React.useState('');
    const [saleNumber, setSaleNumber] = React.useState('');
    const [hesEmMigo, setHesEmMigo] = React.useState('');
    const [assigned, setAssigned] = React.useState<string[]>([]);
    const [comercial, setComercial] = React.useState('');
    const [manualProgress, setManualProgress] = React.useState(0);
    
    const [otNumber, setOtNumber] = React.useState('');

    // Invoice Management State
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [newInvoiceNumber, setNewInvoiceNumber] = React.useState('');
    const [newInvoiceDate, setNewInvoiceDate] = React.useState<Date | undefined>(new Date());
    const [newInvoiceAmount, setNewInvoiceAmount] = React.useState(0);
    
    // Notification State
    const [sendEmailNotification, setSendEmailNotification] = React.useState(true);
    const [ccRecipients, setCcRecipients] = React.useState<string[]>([]);

    const lastUsedOt = React.useMemo(() => getLastOtNumber(categoryPrefix), [categoryPrefix, getLastOtNumber, workOrders]);
    
    React.useEffect(() => {
        if (categoryPrefix) {
            const nextOt = getNextOtNumber(categoryPrefix);
            setOtNumber(nextOt);
        } else {
            setOtNumber('');
        }
    }, [categoryPrefix, workOrders, getNextOtNumber]);


    const technicians = collaborators
      .filter(c => c.role === 'Técnico' && c.status === 'Activo')
      .map(c => ({ value: c.name, label: c.name }));
    
    const supervisors = collaborators
      .filter(c => (['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role)) && c.status === 'Activo')
      .map(c => ({ value: c.name, label: c.name }));

    const vendors = collaborators
      .filter(c => c.role === 'Comercial' && c.status === 'Activo')
      .map(c => ({ value: c.name, label: c.name }));

    const collaboratorEmailOptions = collaborators
        .filter(c => c.email)
        .map(c => ({ value: c.id, label: `${c.name} (${c.email})` }));


  const vehicleOptions = vehicles.map(v => ({
    value: v.plate,
    label: `${v.model} (${v.plate})`,
  }));


  const handleCreateOrder = async () => {
    if (!description || !otNumber) {
        toast({
            variant: "destructive",
            title: "Campos Requeridos",
            description: "Por favor, completa el número de OT y el nombre de la OT.",
        });
        return;
    }
    
     if (sendEmailNotification && !comercial) {
        toast({
            variant: "destructive",
            title: "Comercial Requerido",
            description: "Debes asignar un comercial para poder enviar la notificación por correo.",
        });
        return;
    }

    setIsSubmitting(true);

    const newOrder: Omit<WorkOrder, 'id'> = {
        ot_number: otNumber,
        description,
        createdAt: createdAt ? format(createdAt, 'yyyy-MM-dd') : '',
        client,
        rut,
        service,
        date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        startTime,
        endTime,
        technicians: selectedTechnicians,
        vehicles: selectedVehicles,
        rentedVehicle,
        notes,
        status,
        priority,
        netPrice,
        invoices: invoices,
        ocNumber,
        saleNumber,
        hesEmMigo,
        assigned,
        comercial,
        manualProgress,
    };
    
    const notificationData: NewOrderNotification | null = sendEmailNotification
        ? { send: true, cc: ccRecipients }
        : null;
    
    try {
        await addOrder(newOrder, notificationData);

        toast({
        title: "Orden de Trabajo Creada",
        description: "La nueva orden de trabajo ha sido creada exitosamente.",
        duration: 2000,
        });
        
        router.push('/orders');
    } catch(error) {
        console.error("Failed to create order:", error);
        setIsSubmitting(false);
    }
  };

  const formatCurrency = (num: number): string => {
    return isNaN(num) ? '' : new Intl.NumberFormat('es-CL').format(num);
  };

  const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const numericValue = parseInt(rawValue, 10);
    setNetPrice(isNaN(numericValue) ? 0 : numericValue);
  };
  
  const totalPrice = Math.round(netPrice * 1.19);
  const ivaPrice = Math.round(netPrice * 0.19);

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
    setInvoices([...invoices, newInvoice]);
    // Reset form
    setNewInvoiceNumber('');
    setNewInvoiceDate(new Date());
    setNewInvoiceAmount(0);
  };

  const handleRemoveInvoice = (id: string) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
  };
  
  if (!canCreate) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
                <CardDescription>No tienes permisos para crear nuevas Órdenes de Trabajo.</CardDescription>
            </CardHeader>
        </Card>
    )
  }


  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-headline font-bold tracking-tight">
          Crear Nueva Orden de Trabajo
      </h1>

      <Card>
        <CardContent className="p-6">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <Label htmlFor="ot-name">Nombre de OT *</Label>
                        <Input 
                            id="ot-name" 
                            placeholder="Escribe el nombre o descripción de la OT..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                     <div className="md:col-span-1">
                        <Label htmlFor="creation-date">Fecha de Creación (OT)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !createdAt && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {createdAt ? format(createdAt, "PPP", { locale: es }) : <span>Elegir fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={createdAt}
                                onSelect={setCreatedAt}
                                initialFocus
                                locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="ot_number">Número de OT *</Label>
                    <div className="flex items-center gap-4">
                         <div className="w-48">
                             <Select onValueChange={setCategoryPrefix} value={categoryPrefix}>
                                <SelectTrigger id="ot-category">
                                    <SelectValue placeholder="Categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {otCategories.filter(cat => cat.status === 'Activa').map(cat => (
                                        <SelectItem key={cat.id} value={cat.prefix}>{cat.name} ({cat.prefix})</SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                         </div>
                        <Input 
                            id="ot_number" 
                            placeholder="N/A" 
                            value={otNumber}
                            onChange={(e) => setOtNumber(e.target.value)}
                            className="w-48"
                        />
                    </div>
                     {lastUsedOt && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Último usado en esta categoría: <span className="font-semibold">{lastUsedOt}</span>
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="client">Cliente</Label>
                                <Input 
                                    id="client" 
                                    placeholder="Escribe el nombre del cliente..." 
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                />
                            </div>
                             <div>
                                <Label htmlFor="rut">RUT Cliente</Label>
                                <Input 
                                    id="rut" 
                                    placeholder="Ej: 12.345.678-9" 
                                    value={rut}
                                    onChange={(e) => setRut(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="service">Servicio</Label>
                            <Select onValueChange={setService} value={service}>
                            <SelectTrigger id="service">
                                <SelectValue placeholder="Elegir servicio..." />
                            </SelectTrigger>
                            <SelectContent>
                                {services.filter(s => s.status === 'Activa').map(service => (
                                    <SelectItem key={service.id} value={service.name}>{service.name}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start-date">Fecha de Inicio</Label>
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
                                        onSelect={setStartDate}
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
                                        onSelect={setEndDate}
                                        initialFocus
                                        locale={es}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="start-time">Hora Inicio</Label>
                                <Input type="time" id="start-time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="end-time">Hora Término</Label>
                                <Input type="time" id="end-time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                            </div>
                        </div>
                        
                        <div>
                            <Label>Técnicos Asignados</Label>
                            <MultiSelect
                                options={technicians}
                                selected={selectedTechnicians}
                                onChange={setSelectedTechnicians}
                                placeholder="Seleccionar técnicos..."
                            />
                        </div>
                        
                        <div>
                            <Label>Vehículos Asignados</Label>
                            <MultiSelect
                                options={vehicleOptions}
                                selected={selectedVehicles}
                                onChange={setSelectedVehicles}
                                placeholder="Seleccionar vehículos..."
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="rented-vehicle">Vehículo Arrendado (Opcional)</Label>
                            <Input 
                                id="rented-vehicle" 
                                placeholder="Ej: Hertz, PPU..." 
                                value={rentedVehicle}
                                onChange={(e) => setRentedVehicle(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Descripción / Notas Adicionales</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Añadir descripción detallada, materiales, notas..." 
                                rows={5}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                             />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="status">Estado</Label>
                                <Select 
                                    onValueChange={(v) => setStatus(v as WorkOrder['status'])}
                                    value={status}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {otStatuses.map(s => (
                                            <SelectItem key={s.id} value={s.name}>{s.name.toUpperCase()}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="priority">Prioridad</Label>
                                <Select 
                                    defaultValue="Baja" 
                                    onValueChange={(v) => setPriority(v as WorkOrder['priority'])}
                                    value={priority}
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
                                value={formatCurrency(netPrice)}
                                onChange={handleNetPriceChange}
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
                                    value={ocNumber}
                                    onChange={(e) => setOcNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="sale-number">Nº Venta</Label>
                                <Input 
                                    id="sale-number" 
                                    value={saleNumber}
                                    onChange={(e) => setSaleNumber(e.target.value)}
                                />
                            </div>
                        </div>
                        
                         <div>
                            <Label htmlFor="hes-em-migo">HES / EM / MIGO</Label>
                            <Input 
                                id="hes-em-migo" 
                                value={hesEmMigo}
                                onChange={(e) => setHesEmMigo(e.target.value)}
                            />
                        </div>


                        <div>
                            <Label>Encargados</Label>
                            <MultiSelect
                                options={supervisors}
                                selected={assigned}
                                onChange={setAssigned}
                                placeholder="Seleccionar encargados..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="vendor">Comercial</Label>
                            <Select onValueChange={setComercial} value={comercial}>
                                <SelectTrigger id="vendor">
                                    <SelectValue placeholder="Seleccionar comercial" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map(v => <SelectItem key={v.value} value={v.label}>{v.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="pt-2">
                            <Label>Avance Manual ({manualProgress}%)</Label>
                             <Slider
                                value={[manualProgress]}
                                onValueChange={(value) => setManualProgress(value[0])}
                                max={100}
                                step={5}
                            />
                        </div>

                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
        <Card>
            <CardHeader>
                <CardTitle>Notificación por Correo</CardTitle>
                <CardDescription>
                    Envía un correo al comercial asignado para notificar la creación de esta OT.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="email-notification"
                        checked={sendEmailNotification}
                        onCheckedChange={setSendEmailNotification}
                    />
                    <Label htmlFor="email-notification">Notificar Creación por Correo</Label>
                </div>
                {sendEmailNotification && (
                    <div>
                        <Label>Añadir en Copia (CC)</Label>
                        <MultiSelect
                            options={collaboratorEmailOptions}
                            selected={ccRecipients}
                            onChange={setCcRecipients}
                            placeholder="Seleccionar destinatarios..."
                        />
                    </div>
                )}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Añadir Nueva Factura</CardTitle>
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
                    <Button onClick={handleAddInvoice} size="sm">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Agregar Factura a la Lista
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
              <CardTitle>Gestión de Facturas</CardTitle>
            </CardHeader>
            <CardContent>
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
                              {invoices.map((inv) => (
                                  <TableRow key={inv.id}>
                                      <TableCell>{inv.number}</TableCell>
                                      <TableCell>{format(new Date(inv.date.replace(/-/g, '/')), "PPP", { locale: es })}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(inv.amount)}</TableCell>
                                      <TableCell className="text-right">{formatCurrency(Math.round(inv.amount * 1.19))}</TableCell>
                                      <TableCell>
                                          <Button variant="ghost" size="icon" onClick={() => handleRemoveInvoice(inv.id)}>
                                              <Trash2 className="h-4 w-4 text-destructive"/>
                                          </Button>
                                      </TableCell>
                                  </TableRow>
                              ))}
                              {invoices.length === 0 && (
                                  <TableRow>
                                      <TableCell colSpan={5} className="h-24 text-center">
                                          No se han añadido facturas.
                                      </TableCell>
                                  </TableRow>
                              )}
                          </TableBody>
                      </Table>
                  </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end gap-2 mt-8">
            <Button variant="outline" asChild><Link href="/orders">Cancelar</Link></Button>
            <Button onClick={handleCreateOrder} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear OT
            </Button>
        </div>
    </div>
  );
}
