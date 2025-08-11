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
import { useWorkOrders } from "@/context/work-orders-context";

export default function NewOrderPage() {
  const [startDate, setStartDate] = React.useState<Date>();
  const [endDate, setEndDate] = React.useState<Date>();
  const [selectedTechnicians, setSelectedTechnicians] = React.useState<string[]>([]);
  const [selectedVehicles, setSelectedVehicles] = React.useState<string[]>([]);
  const [netPrice, setNetPrice] = React.useState(0);
  const [totalPrice, setTotalPrice] = React.useState(0);
  const { toast } = useToast();
  const { otCategories } = useWorkOrders();

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

  const handleCreateOrder = () => {
    toast({
      title: "Orden de Trabajo Creada",
      description: "La nueva orden de trabajo ha sido creada exitosamente.",
    });
  };

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '');
    const numericValue = parseInt(rawValue, 10);

    if (!isNaN(numericValue)) {
      setNetPrice(numericValue);
      setTotalPrice(Math.round(numericValue * 1.19));
    } else {
      setNetPrice(0);
      setTotalPrice(0);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold tracking-tight">
          Crear Nueva Orden de Trabajo
        </h1>
        <div className="flex items-center gap-2">
            <Label htmlFor="ot-name" className="text-sm font-medium">Nombre de OT *</Label>
            <Input id="ot-name" placeholder="Nombre de OT..." className="w-96" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Left Column */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="ot-category">Categoría OT *</Label>
                        <Select>
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
                        <Input id="client" placeholder="Escribe el nombre del cliente..." />
                    </div>

                    <div>
                        <Label htmlFor="service">Servicio</Label>
                        <Select>
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
                        <Textarea id="description" placeholder="Añadir descripción detallada, materiales, notas..." rows={5} />
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
                            <Select defaultValue="por-iniciar">
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
                            <Select defaultValue="baja">
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
                <Button onClick={handleCreateOrder}>Crear OT</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
