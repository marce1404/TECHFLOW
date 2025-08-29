

'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ArrowUpDown, History } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from "@/components/ui/alert-dialog"
import { useWorkOrders } from '@/context/work-orders-context';
import type { Vehicle } from '@/lib/types';
import Link from 'next/link';

interface VehiclesTableProps {
    vehicles: Vehicle[];
    requestSort: (key: keyof Vehicle) => void;
    sortConfig: { key: keyof Vehicle | null; direction: 'ascending' | 'descending' };
}

export default function VehiclesTable({ vehicles, requestSort, sortConfig }: VehiclesTableProps) {
    const { deleteVehicle, updateVehicle } = useWorkOrders();
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;

    const getStatusVariant = (status: Vehicle['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status) {
            case 'Disponible':
                return 'default';
            case 'Asignado':
                return 'secondary';
            case 'En Mantenimiento':
                return 'destructive';
            default:
                return 'outline';
        }
    }
    
    const headers: { key: keyof Vehicle | 'lastMaintenance' | 'assignmentHistory', label: string }[] = [
        { key: 'model', label: 'Vehículo' },
        { key: 'plate', label: 'Patente' },
        { key: 'status', label: 'Estado' },
        { key: 'assignedTo', label: 'Asignado a' },
    ];
    
    const handleStatusChange = (vehicle: Vehicle, status: Vehicle['status']) => {
        const updatedVehicle: Partial<Vehicle> = { status };
        if (status === 'Disponible' || status === 'En Mantenimiento') {
            updatedVehicle.assignedTo = '';
        }
        updateVehicle(vehicle.id, updatedVehicle);
    };
    
    const totalPages = Math.ceil(vehicles.length / itemsPerPage);
    const paginatedData = vehicles.slice(
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
    }, [vehicles]);


    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            {headers.map((header) => (
                            <TableHead key={header.key}>
                                    <Button variant="ghost" onClick={() => requestSort(header.key as keyof Vehicle)}>
                                        {header.label}
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                            ))}
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? paginatedData.map((vehicle) => {
                            return (
                            <TableRow key={vehicle.id}>
                                <TableCell className="font-medium">
                                    <div>{vehicle.model}</div>
                                    <div className="text-xs text-muted-foreground">{vehicle.year}</div>
                                </TableCell>
                                <TableCell>
                                    <Link href={`/vehicles/${vehicle.id}/edit`} className="text-primary hover:underline">
                                        {vehicle.plate}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="p-0 h-auto">
                                                <Badge variant={getStatusVariant(vehicle.status)} className="cursor-pointer">
                                                    {vehicle.status}
                                                </Badge>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => handleStatusChange(vehicle, 'Disponible')}>Disponible</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleStatusChange(vehicle, 'Asignado')} disabled={!vehicle.assignedTo}>Asignado</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleStatusChange(vehicle, 'En Mantenimiento')}>En Mantenimiento</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                <TableCell>{vehicle.assignedTo || 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menú</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/vehicles/${vehicle.id}/edit`}>Editar</Link>
                                                </DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        Eliminar
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente el vehículo
                                                <span className="font-bold"> {vehicle.model} ({vehicle.plate})</span>.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => deleteVehicle(vehicle.id)}
                                            >
                                                Eliminar
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )}) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No hay resultados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, vehicles.length)} de {vehicles.length} vehículos.
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                    <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                </div>
            </div>
        </div>
    );
}
