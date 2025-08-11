
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useWorkOrders } from '@/context/work-orders-context';
import TechniciansTable from '@/components/technicians/technicians-table';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Technician } from '@/lib/types';

export default function TechniciansPage() {
    const { technicians } = useWorkOrders();
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<Technician['status'] | 'Todos'>('Todos');

    const filteredTechnicians = technicians.filter((technician) => {
        const matchesStatus = statusFilter === 'Todos' || technician.status === statusFilter;
        const matchesSearch = 
            technician.name.toLowerCase().includes(search.toLowerCase()) ||
            technician.specialty.toLowerCase().includes(search.toLowerCase()) ||
            technician.area.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const technicianStatuses: (Technician['status'] | 'Todos')[] = ['Todos', 'Activo', 'Licencia', 'Vacaciones'];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Técnicos
                </h1>
                <Button asChild>
                    <Link href="/technicians/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Técnico
                    </Link>
                </Button>
            </div>
            
            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as Technician['status'] | 'Todos')}>
              <div className="flex items-center justify-between">
                <TabsList>
                    {technicianStatuses.map(status => (
                        <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
                    ))}
                </TabsList>
                <Input
                    placeholder="Buscar por nombre, especialidad..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
              </div>
              <TabsContent value={statusFilter}>
                  <TechniciansTable technicians={filteredTechnicians} />
              </TabsContent>
            </Tabs>
        </div>
    );
}
