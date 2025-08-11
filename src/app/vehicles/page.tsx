
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useWorkOrders } from '@/context/work-orders-context';
import VehiclesTable from '@/components/vehicles/vehicles-table';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import type { Vehicle } from '@/lib/types';

export default function VehiclesPage() {
    const { vehicles } = useWorkOrders();
    const [search, setSearch] = React.useState('');

    const filteredVehicles = vehicles.filter(
        (vehicle) =>
            vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
            vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
            vehicle.year.toString().toLowerCase().includes(search.toLowerCase())
    );

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
            
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Buscar por marca, modelo, patente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            
            <VehiclesTable vehicles={filteredVehicles} />
        </div>
    );
}
