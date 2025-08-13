
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
                                {otStatuses.map((status) => (
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
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
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
