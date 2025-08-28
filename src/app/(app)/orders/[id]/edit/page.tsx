

'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react";
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

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { getOrder, updateOrder, otCategories, services, collaborators, ganttCharts, otStatuses, vehicles, promptToCloseOrder } = useWorkOrders();
  const orderId = params.id as string;
  
  const initialOrder = getOrder(orderId);

  const [order, setOrder] = React.useState<WorkOrder | undefined>(initialOrder);

  const { toast } = useToast();

  React.useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const technicians = collaborators
    .filter(c => c.role === 'Técnico')
    .map(c => ({ value: c.name, label: c.name }));

  const supervisors = collaborators
    .filter(c => ['Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado'].includes(c.role))
    .map(c => ({ value: c.name, label: c.name }));

  const vendors = collaborators
    .filter(c => c.role === 'Vendedor')
    .map(c => ({ value: c.name, label: c.name }));
  
  const vehicleOptions = vehicles.map(v => ({
    value: v.plate,
    label: `${v.model} (${v.plate})`,
  }));

  const handleInputChange = (field: keyof WorkOrder, value: any) => {
    if (order) {
      const newOrder = { ...order, [field]: value };
      if (field === 'invoiceNumber') {
          newOrder.facturado = !!value;
      }
      setOrder(newOrder);
    }
  };
  
  const handleStatusChange = (value: WorkOrder['status']) => {
    if (!order) return;
    if (value.toLowerCase() === 'cerrada') {
        promptToCloseOrder(order);
    } else {
        handleInputChange('status', value);
    }
  };

  const handleDateChange = (field: keyof WorkOrder, value: Date | undefined) => {
    if (order) {
        handleInputChange(field, value ? format(value, 'yyyy-MM-dd') : undefined);
    }
  };

  const formatNumber = (num: number): string => {
    return isNaN(num) ? '' : new Intl.NumberFormat('es-CL').format(num);
  };

  const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!order) return;
    const rawValue = e.target.value.replace(/\./g, '');
    const numericValue = parseInt(rawValue, 10);

    if (!isNaN(numericValue)) {
      handleInputChange('netPrice', numericValue);
    } else {
      handleInputChange('netPrice', 0);
    }
  };


  const handleUpdateOrder = async () => {
    if (!order) return;

    await updateOrder(order.id, order);

    toast({
      title: "Orden de Trabajo Actualizada",
      description: `La OT "${order.description}" ha sido actualizada.`,
      duration: 2000,
    });
    
    // The context's fetchData will handle moving the order,
    // so we can reliably redirect.
    if (order.status === 'Cerrada') {
      router.push(`/orders/history`);
    } else {
      router.push(`/orders`);
    }
  };

  if (!order) {
      return <div>Cargando orden de trabajo...</div>
  }

  // By replacing hyphens with slashes, we ensure the date is parsed in the local time zone,
  // preventing hydration mismatches between server and client.
  const startDate = order.date ? new Date(order.date.replace(/-/g, '/')) : undefined;
  const endDate = order.endDate ? new Date(order.endDate.replace(/-/g, '/')) : undefined;
  const totalPrice = order.netPrice ? Math.round(order.netPrice * 1.19) : 0;
  const currentPrefix = order.ot_number.split('-')[0];
  
  const assignedGantt = ganttCharts.find(g => g.assignedOT === order.ot_number);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-headline font-bold tracking-tight">
        Editar Orden de Trabajo
      </h1>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="ot-name">Nombre de OT *</Label>
              <Input
                id="ot-name"
                value={order.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
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
                            if (order) {
                                const newOtNumber = `${value}-${order.ot_number.split('-')[1]}`
                                handleInputChange('ot_number', newOtNumber)
                            }
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

                    <div>
                        <Label htmlFor="client">Cliente</Label>
                        <Input 
                          id="client" 
                          value={order.client}
                          onChange={(e) => handleInputChange('client', e.target.value)}
                          placeholder="Escribe el nombre del cliente..." 
                        />
                    </div>

                    <div>
                        <Label htmlFor="service">Servicio</Label>
                        <Select 
                          value={order.service.toLowerCase()}
                          onValueChange={(value) => handleInputChange('service', value)}
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
                                    onSelect={(date) => handleDateChange('date', date)}
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
                                    onSelect={(date) => handleDateChange('endDate', date)}
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
                            selected={order.technicians || []}
                            onChange={(selected) => handleInputChange('technicians', selected)}
                            placeholder="Seleccionar técnicos..."
                        />
                    </div>
                    
                    <div>
                        <Label>Vehículos Asignados</Label>
                         <MultiSelect
                            options={vehicleOptions}
                            selected={order.vehicles || []}
                            onChange={(selected) => handleInputChange('vehicles', selected)}
                            placeholder="Seleccionar vehículos..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Descripción / Notas Adicionales</Label>
                        <Textarea 
                          id="notes" 
                          value={order.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)} 
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
                              value={order.status}
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
                              value={order.priority}
                              onValueChange={(value) => handleInputChange('priority', value)}
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
                                value={formatNumber(order.netPrice)}
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

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <Label htmlFor="oc-number">OC</Label>
                            <Input 
                                id="oc-number"
                                value={order.ocNumber || ''}
                                onChange={(e) => handleInputChange('ocNumber', e.target.value)}
                            />
                        </div>
                         <div>
                            <Label htmlFor="invoice-number">Nº Factura</Label>
                            <Input 
                                id="invoice-number" 
                                value={order.invoiceNumber || ''}
                                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Encargados</Label>
                        <MultiSelect
                            options={supervisors}
                            selected={order.assigned || []}
                            onChange={(selected) => handleInputChange('assigned', selected)}
                            placeholder="Seleccionar encargados..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="vendor">Vendedor</Label>
                        <Select
                          value={order.vendedor}
                          onValueChange={(value) => handleInputChange('vendedor', value)}
                        >
                            <SelectTrigger id="vendor">
                                <SelectValue placeholder="Seleccionar vendedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => <SelectItem key={v.value} value={v.label}>{v.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                     {assignedGantt && (
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
                    )}
                    
                    {order.status === 'Cerrada' && order.endDate && (
                      <div>
                        <Label>Fecha de Cierre</Label>
                        <Input value={format(new Date(order.endDate.replace(/-/g, '/')), "PPP", { locale: es })} readOnly className="bg-muted"/>
                      </div>
                    )}
                </div>
            </div>
            </div>


            <div className="flex justify-end gap-2 mt-8">
                <Button variant="outline" asChild><Link href="/orders">Cancelar</Link></Button>
                <Button onClick={handleUpdateOrder}>Guardar Cambios</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
