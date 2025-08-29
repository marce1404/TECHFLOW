
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import * as React from "react";
import Link from 'next/link';
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { useWorkOrders } from "@/context/work-orders-context";
import type { WorkOrder } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function NewOrderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { otCategories, services, addOrder, getNextOtNumber, collaborators, otStatuses, vehicles } = useWorkOrders();

    const [description, setDescription] = React.useState('');
    const [categoryPrefix, setCategoryPrefix] = React.useState('');
    const [client, setClient] = React.useState('');
    const [service, setService] = React.useState('');
    const [startDate, setStartDate] = React.useState<Date>();
    const [endDate, setEndDate] = React.useState<Date>();
    const [selectedTechnicians, setSelectedTechnicians] = React.useState<string[]>([]);
    const [selectedVehicles, setSelectedVehicles] = React.useState<string[]>([]);
    const [notes, setNotes] = React.useState('');
    const [status, setStatus] = React.useState<WorkOrder['status']>(otStatuses.length > 0 ? otStatuses[0].name as WorkOrder['status'] : 'Por Iniciar');
    const [priority, setPriority] = React.useState<WorkOrder['priority']>('Baja');
    const [netPrice, setNetPrice] = React.useState(0);
    const [invoiceNumber, setInvoiceNumber] = React.useState('');
    const [ocNumber, setOcNumber] = React.useState('');
    const [assigned, setAssigned] = React.useState<string[]>([]);
    const [vendedor, setVendedor] = React.useState('');
    

    const technicians = collaborators
      .filter(c => c.role === 'Técnico' && c.status === 'Activo')
      .map(c => ({ value: c.id, label: c.name }));
    
    const supervisors = collaborators
      .filter(c => (['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role)) && c.status === 'Activo')
      .map(c => ({ value: c.id, label: c.name }));

    const vendors = collaborators
      .filter(c => c.role === 'Vendedor' && c.status === 'Activo')
      .map(c => ({ value: c.id, label: c.name }));

  const vehicleOptions = vehicles.map(v => ({
    value: v.plate,
    label: `${v.model} (${v.plate})`,
  }));


  const handleCreateOrder = () => {
    if (!description || !categoryPrefix) {
        toast({
            variant: "destructive",
            title: "Campos Requeridos",
            description: "Por favor, completa el nombre y la categoría de la OT.",
        });
        return;
    }

    const newOrder: Omit<WorkOrder, 'id'> = {
        ot_number: getNextOtNumber(categoryPrefix),
        description,
        client,
        service,
        date: startDate ? format(startDate, 'yyyy-MM-dd') : '',
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
        technicians: selectedTechnicians.map(id => collaborators.find(c => c.id === id)?.name || ''),
        vehicles: selectedVehicles,
        notes,
        status,
        priority,
        netPrice,
        invoiceNumber,
        ocNumber,
        facturado: !!invoiceNumber,
        assigned: assigned.map(id => collaborators.find(c => c.id === id)?.name || ''),
        vendedor: collaborators.find(c => c.id === vendedor)?.name || '',
    };
    
    addOrder(newOrder);

    toast({
      title: "Orden de Trabajo Creada",
      description: "La nueva orden de trabajo ha sido creada exitosamente.",
      duration: 1000,
    });
    
    setTimeout(() => {
        router.push('/orders');
    }, 1000);
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const numericValue = parseInt(rawValue, 10);

    if (!isNaN(numericValue)) {
      setNetPrice(numericValue);
    } else {
      setNetPrice(0);
    }
  };
  
  const totalPrice = Math.round(netPrice * 1.19);


  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-headline font-bold tracking-tight">
          Crear Nueva Orden de Trabajo
      </h1>

      <Card>
        <CardContent className="p-6">
            <div className="space-y-6">
                <div>
                    <Label htmlFor="ot-name">Nombre de OT *</Label>
                    <Input 
                        id="ot-name" 
                        placeholder="Escribe el nombre o descripción de la OT..." 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="ot-category">Categoría OT *</Label>
                            <Select onValueChange={setCategoryPrefix} value={categoryPrefix}>
                            <SelectTrigger id="ot-category">
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                {otCategories.filter(cat => cat.status === 'Activa').map(cat => (
                                    <SelectItem key={cat.prefix} value={cat.prefix}>{cat.name} ({cat.prefix})</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>

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
                            <Label htmlFor="service">Servicio</Label>
                            <Select onValueChange={setService} value={service}>
                            <SelectTrigger id="service">
                                <SelectValue placeholder="Elegir servicio..." />
                            </SelectTrigger>
                            <SelectContent>
                                {services.filter(s => s.status === 'Activa').map(service => (
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
                            <Input id="rented-vehicle" placeholder="Ej: Hertz, PPU..." />
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
                                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
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
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="net-price">Precio Neto</Label>
                                <Input 
                                id="net-price" 
                                type="text" 
                                value={formatNumber(netPrice)}
                                onChange={handleNetPriceChange}
                                />
                            </div>
                            <div>
                                <Label htmlFor="total-price">Precio Total</Label>
                                <Input 
                                id="total-price" 
                                type="text" 
                                value={formatNumber(totalPrice)}
                                readOnly 
                                className="bg-muted"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="sale-number">Nº Venta</Label>
                                <Input id="sale-number" />
                            </div>
                            <div>
                                <Label htmlFor="hes-em-migo">HES / EM / MIGO</Label>
                                <Input id="hes-em-migo" />
                            </div>
                             <div>
                                <Label htmlFor="oc-number">OC</Label>
                                <Input 
                                    id="oc-number" 
                                    value={ocNumber}
                                    onChange={(e) => setOcNumber(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="invoice-number">Nº Factura</Label>
                            <Input 
                                id="invoice-number" 
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
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
                            <Label htmlFor="vendor">Vendedor</Label>
                            <Select onValueChange={setVendedor} value={vendedor}>
                                <SelectTrigger id="vendor">
                                    <SelectValue placeholder="Seleccionar vendedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>


            <div className="flex justify-end gap-2 mt-8">
                <Button variant="outline" asChild><Link href="/orders">Cancelar</Link></Button>
                <Button onClick={handleCreateOrder}>Crear OT</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
