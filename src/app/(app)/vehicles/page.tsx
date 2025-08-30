
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
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function VehiclesPage() {
    const { vehicles } = useWorkOrders();
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<Vehicle['status'] | 'Todos'>('Todos');
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof Vehicle | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;


    const requestSort = (key: keyof Vehicle) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedVehicles = React.useMemo(() => {
        let sortableItems = [...vehicles];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue === undefined || aValue === null || aValue < bValue!) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (bValue === undefined || bValue === null || aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [vehicles, sortConfig]);


    const filteredVehicles = sortedVehicles.filter(
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
    
    const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
    const paginatedData = filteredVehicles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, search]);


    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardContent className="p-4">
                    <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as Vehicle['status'] | 'Todos')}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                            <ScrollArea className="w-full sm:w-auto">
                                <TabsList className="w-max">
                                    {vehicleStatuses.map(status => (
                                        <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
                                    ))}
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            <div className="flex w-full sm:w-auto items-center gap-2">
                                <Input
                                    placeholder="Buscar por marca, patente, asignado..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:max-w-sm"
                                />
                                <Button asChild>
                                    <Link href="/vehicles/new">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Nuevo Vehículo
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <TabsContent value={statusFilter}>
                            <VehiclesTable 
                                vehicles={paginatedData}
                                requestSort={requestSort}
                                sortConfig={sortConfig}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} de {filteredVehicles.length} vehículos.
                        </div>
                        <div className="flex items-center space-x-2 ml-auto">
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            >
                            Anterior
                            </Button>
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            >
                            Siguiente
                            </Button>
                        </div>
                    </CardFooter>
                 )}
            </Card>
        </div>
    );
}
