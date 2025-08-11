
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useWorkOrders } from '@/context/work-orders-context';
import VehiclesTable from '@/components/vehicles/vehicles-table';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import type { Vehicle } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function VehiclesPage() {
    const { vehicles } = useWorkOrders();
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<Vehicle['status'] | 'Todos'>('Todos');


    const filteredVehicles = vehicles.filter(
        (vehicle) => {
            const matchesStatus = statusFilter === 'Todos' || vehicle.status === statusFilter;
            const matchesSearch = 
                vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
                vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
                (vehicle.assignedTo && vehicle.assignedTo.toLowerCase().includes(search.toLowerCase()));
            return matchesStatus && matchesSearch;
        }
    );

    const vehicleStatuses: (Vehicle['status'] | 'Todos')[] = ['Todos', 'Disponible', 'Asignado', 'En Mantenimiento'];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Vehículos
                </h1>
                <Button asChild>
                    <Link href="/vehicles/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Vehículo
                    </Link>
                </Button>
            </div>
            
             <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as Vehicle['status'] | 'Todos')}>
              <div className="flex items-center justify-between">
                <TabsList>
                    {vehicleStatuses.map(status => (
                        <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
                    ))}
                </TabsList>
                <Input
                    placeholder="Buscar por marca, patente, asignado..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
              </div>
              <TabsContent value={statusFilter}>
                <VehiclesTable vehicles={filteredVehicles} />
              </TabsContent>
            </Tabs>
        </div>
    );
}
