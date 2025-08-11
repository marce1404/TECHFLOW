
'use client';

import * as React from 'react';
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
import { MoreHorizontal, Wrench, CheckCircle, User, Truck } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface VehiclesTableProps {
    vehicles: Vehicle[];
}

export default function VehiclesTable({ vehicles }: VehiclesTableProps) {
    const { deleteVehicle } = useWorkOrders();

    const getStatusConfig = (status: Vehicle['status']) => {
        switch (status) {
            case 'Disponible':
                return {
                    variant: 'default',
                    icon: CheckCircle,
                    className: 'bg-green-500/80 text-white',
                    label: 'Disponible',
                };
            case 'Asignado':
                return {
                    variant: 'secondary',
                    icon: User,
                    className: 'bg-blue-500/80 text-white',
                    label: 'Asignado',
                };
            case 'En Mantenimiento':
                return {
                    variant: 'destructive',
                    icon: Wrench,
                    className: 'bg-yellow-500/80 text-white',
                    label: 'En Mantenimiento',
                };
            default:
                return {
                    variant: 'outline',
                    icon: Truck,
                    className: '',
                    label: status,
                };
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Patente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Asignado a</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {vehicles.length > 0 ? vehicles.map((vehicle) => {
                        const statusConfig = getStatusConfig(vehicle.status);
                        return (
                        <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <div>{vehicle.model}</div>
                                        <div className="text-xs text-muted-foreground">{vehicle.year}</div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>{vehicle.plate}</TableCell>
                            <TableCell>
                                <Badge variant={statusConfig.variant as any} className={cn('gap-1.5', statusConfig.className)}>
                                    <statusConfig.icon className="h-3.5 w-3.5" />
                                    {statusConfig.label}
                                </Badge>
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
                            <TableCell colSpan={5} className="h-24 text-center">
                                No hay resultados.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
