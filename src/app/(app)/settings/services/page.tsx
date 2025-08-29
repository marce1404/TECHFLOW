
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import type { Service } from '@/lib/types';
import { ServiceFormDialog } from '@/components/settings/service-form-dialog';

export default function ServicesPage() {
    const { services, addService, updateService, deleteService } = useWorkOrders();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedService, setSelectedService] = React.useState<Service | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;

    const handleSave = (service: Omit<Service, 'id'> | Service) => {
        if ('id' in service) {
            updateService(service.id, service);
        } else {
            addService(service);
        }
    };

    const handleEdit = (service: Service) => {
        setSelectedService(service);
        setDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedService(null);
        setDialogOpen(true);
    };

    const handleToggleStatus = (service: Service) => {
        const newStatus = service.status === 'Activa' ? 'Inactiva' : 'Activa';
        updateService(service.id, { ...service, status: newStatus });
    };

    const totalPages = Math.ceil(services.length / itemsPerPage);
    const paginatedData = services.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-end">
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Servicio
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Servicios Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? paginatedData.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={service.status === 'Activa' ? 'default' : 'outline'}>{service.status}</Badge>
                                        </TableCell>
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
                                                        <DropdownMenuItem onClick={() => handleEdit(service)}>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
                                                            {service.status === 'Activa' ? 'Desactivar' : 'Activar'}
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
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el servicio
                                                        <span className="font-bold"> {service.name}</span>.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        className="bg-destructive hover:bg-destructive/90"
                                                        onClick={() => deleteService(service.id)}
                                                    >
                                                        Eliminar
                                                    </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">No hay servicios para mostrar.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between text-sm text-muted-foreground pt-6">
                        <div>
                            Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, services.length)} de {services.length} servicios.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                            <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
            <ServiceFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                service={selectedService}
            />
        </div>
    );
}
