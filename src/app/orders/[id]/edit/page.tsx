

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
import * as React from "react";
import Link from 'next/link';
import { MultiSelect } from "@/components/ui/multi-select";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import { activeWorkOrders, historicalWorkOrders } from "@/lib/placeholder-data";

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  // In a real app, you would fetch the order details based on the ID
  const order = [...activeWorkOrders, ...historicalWorkOrders].find(o => o.id === orderId);

  const [orderDescription, setOrderDescription] = React.useState(order?.description || '');

  // By replacing hyphens with slashes, we ensure the date is parsed in the local time zone,
  // preventing hydration mismatches between server and client.
  const [startDate, setStartDate] = React.useState<Date | undefined>(order ? new Date(order.date.replace(/-/g, '/')) : new Date());
  const [endDate, setEndDate] = React.useState<Date>();
  const [selectedTechnicians, setSelectedTechnicians] = React.useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = React.useState<string[]>([]);
  const { toast } = useToast();

  const technicians = [
    { value: 'cristian-munoz', label: 'Cristian Muñoz' },
    { value: 'beatriz-herrera', label: 'Beatriz Herrera' },
    { value: 'andres-castillo', label: 'Andrés Castillo' },
    { value: 'juan-perez', label: 'Juan Pérez' },
    { value: 'ana-torres', label: 'Ana Torres' },
  ];
  
  const vehicles = [
    { value: 'hilux', label: 'Toyota Hilux' },
    { value: 'ranger', label: 'Ford Ranger' },
    { value: 'navara', label: 'Nissan Navara' },
  ];

  const vendors = [
    { value: 'fernanda-gomez', label: 'Fernanda Gómez' },
    { value: 'eduardo-flores', label: 'Eduardo Flores' },
    { value: 'daniela-vidal', label: 'Daniela Vidal' },
  ];

  const handleUpdateOrder = () => {
    // In a real app, you would send the updated data to your API here
    toast({
      title: "Orden de Trabajo Actualizada",
      description: `El nombre de la OT se actualizó a: "${orderDescription}"`,
      duration: 2000,
    });
    setTimeout(() => {
        router.push('/orders');
    }, 2000);
  };

  if (!order) {
      return <div>Orden de trabajo no encontrada.</div>
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold tracking-tight">
          Editar Orden de Trabajo
        </h1>
        <div className="flex items-center gap-2">
            <Label htmlFor="ot-name" className="text-sm font-medium">Nombre de OT *</Label>
            <Input 
              id="ot-name" 
              value={orderDescription} 
              onChange={(e) => setOrderDescription(e.target.value)} 
              placeholder="Nombre de OT..." 
              className="w-96" 
            />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="ot-category">Categoría OT *</Label>
                        <Select defaultValue={order.ot_number.split('-')[0].toLowerCase()}>
                        <SelectTrigger id="ot-category">
                            <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="os">Servicio (OS)</SelectItem>
                            <SelectItem value="ot">Proyecto (OT)</SelectItem>
                            <SelectItem value="om">Mantención (OM)</SelectItem>
                            <SelectItem value="otr">Otro (OTR)</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="client">Cliente</Label>
                        <Input id="client" defaultValue={order.client} placeholder="Escribe el nombre del cliente..." />
                    </div>

                    <div>
                        <Label htmlFor="service">Servicio</Label>
                        <Select defaultValue={order.service.toLowerCase()}>
                        <SelectTrigger id="service">
                            <SelectValue placeholder="Elegir categoría..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="cctv">CCTV</SelectItem>
                            <SelectItem value="extincion">Extinción</SelectItem>
                            <SelectItem value="cerco">Cerco</SelectItem>
                            <SelectItem value="deteccion">Detección</SelectItem>
                            <SelectItem value="alarma">Alarma</SelectItem>
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
                                    {startDate ? format(startDate, "PPP",) : <span>Elegir fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
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
                                    {endDate ? format(endDate, "PPP") : <span>Elegir fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    initialFocus
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
                            options={vehicles}
                            selected={selectedVehicles}
                            onChange={setSelectedVehicles}
                            placeholder="Seleccionar vehículos..."
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Descripción / Notas Adicionales</Label>
                        <Textarea id="description" defaultValue={order.description} placeholder="Añadir descripción detallada, materiales, notas..." rows={5} />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="rented-vehicle">Vehículo Arrendado (Opcional)</Label>
                        <Input id="rented-vehicle" placeholder="Ej: Hertz, PPU..." />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="status">Estado</Label>
                            <Select defaultValue={order.status.toLowerCase().replace(' ', '-')}>
                                <SelectTrigger id="status">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="por-iniciar">Por Iniciar</SelectItem>
                                    <SelectItem value="en-progreso">En Progreso</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="atrasada">Atrasada</SelectItem>
                                    <SelectItem value="cerrada">Cerrada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="priority">Prioridad</Label>
                            <Select defaultValue={order.priority.toLowerCase()}>
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="baja">Baja</SelectItem>
                                    <SelectItem value="media">Media</SelectItem>
                                    <SelectItem value="alta">Alta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="net-price">Precio Neto</Label>
                            <Input id="net-price" type="number" defaultValue="0" />
                        </div>
                        <div>
                            <Label htmlFor="total-price">Precio Total</Label>
                            <Input id="total-price" type="number" defaultValue="0" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="sale-number">Nº Venta</Label>
                            <Input id="sale-number" />
                        </div>
                        <div>
                            <Label htmlFor="hes-em-migo">HES / EM / MIGO</Label>
                            <Input id="hes-em-migo" />
                        </div>
                    </div>

                     <div>
                        <Label htmlFor="invoice-number">Nº Factura</Label>
                        <Input id="invoice-number" />
                    </div>

                    <div>
                        <Label htmlFor="manager">Encargado</Label>
                        <Select>
                            <SelectTrigger id="manager">
                                <SelectValue placeholder="Seleccionar encargado" />
                            </SelectTrigger>
                            <SelectContent>
                                {technicians.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="vendor">Vendedor</Label>
                        <Select>
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

            <div className="flex justify-end gap-2 mt-8">
                <Button variant="outline" asChild><Link href="/orders">Cancelar</Link></Button>
                <Button onClick={handleUpdateOrder}>Guardar Cambios</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
