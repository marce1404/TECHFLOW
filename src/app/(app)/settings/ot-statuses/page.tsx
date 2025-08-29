
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkOrders } from '@/context/work-orders-context';
import type { OTStatus } from '@/lib/types';
import { StatusFormDialog } from '@/components/settings/status-form-dialog';

export default function OTStatusesPage() {
    const { otStatuses, addStatus, updateStatus } = useWorkOrders();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedStatus, setSelectedStatus] = React.useState<OTStatus | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;


    const handleSave = (status: Omit<OTStatus, 'id'> | OTStatus) => {
        if ('id' in status) {
            updateStatus(status.id, status);
        } else {
            addStatus(status);
        }
    };

    const handleEdit = (status: OTStatus) => {
        setSelectedStatus(status);
        setDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedStatus(null);
        setDialogOpen(true);
    };

    const totalPages = Math.ceil(otStatuses.length / itemsPerPage);
    const paginatedData = otStatuses.slice(
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
                    Nuevo Estado
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Estados de OT Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? paginatedData.map((status) => (
                                    <TableRow key={status.id}>
                                        <TableCell className="font-medium">{status.name}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(status)}>Editar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                     <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">No hay estados para mostrar.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between text-sm text-muted-foreground pt-6">
                        <div>
                            Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, otStatuses.length)} de {otStatuses.length} estados.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                            <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
            <StatusFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                status={selectedStatus}
            />
        </div>
    );
}
