

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
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import type { Collaborator } from '@/lib/types';
import Link from 'next/link';

interface CollaboratorsTableProps {
    collaborators: Collaborator[];
    requestSort: (key: keyof Collaborator) => void;
    sortConfig: { key: keyof Collaborator | null; direction: 'ascending' | 'descending' };
}

export default function CollaboratorsTable({ collaborators, requestSort, sortConfig }: CollaboratorsTableProps) {
    const { updateCollaborator, deleteCollaborator } = useWorkOrders();

    const handleToggleStatus = (collaborator: Collaborator, status: Collaborator['status']) => {
        updateCollaborator(collaborator.id, { ...collaborator, status });
    };

    const getStatusVariant = (status: Collaborator['status']): 'default' | 'secondary' | 'outline' | 'destructive' => {
        switch (status) {
            case 'Activo':
                return 'default';
            case 'Licencia':
                return 'secondary';
            case 'Vacaciones':
                return 'outline';
            default:
                return 'destructive';
        }
    }

    const headers: { key: keyof Collaborator, label: string }[] = [
        { key: 'name', label: 'Nombre' },
        { key: 'role', label: 'Cargo' },
        { key: 'area', label: 'Área' },
        { key: 'status', label: 'Estado' },
    ];

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        {headers.map((header) => (
                           <TableHead key={header.key}>
                                <Button variant="ghost" onClick={() => requestSort(header.key)}>
                                    {header.label}
                                    <ArrowUpDown className="ml-2 h-4 w-4" />
                                </Button>
                            </TableHead>
                        ))}
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {collaborators.length > 0 ? collaborators.map((collaborator) => (
                        <TableRow key={collaborator.id}>
                            <TableCell className="font-medium">
                                <Link href={`/collaborators/${collaborator.id}/edit`} className="text-primary hover:underline">
                                    {collaborator.name}
                                </Link>
                            </TableCell>
                            <TableCell>{collaborator.role}</TableCell>
                            <TableCell>{collaborator.area}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(collaborator.status)}>{collaborator.status}</Badge>
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
                                            <DropdownMenuItem asChild>
                                                <Link href={`/collaborators/${collaborator.id}/edit`}>Editar</Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(collaborator, 'Activo')}>Marcar como Activo</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(collaborator, 'Licencia')}>Marcar como Licencia</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(collaborator, 'Vacaciones')}>Marcar como Vacaciones</DropdownMenuItem>
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
                                            Esta acción no se puede deshacer. Esto eliminará permanentemente al colaborador
                                            <span className="font-bold"> {collaborator.name}</span>.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-destructive hover:bg-destructive/90"
                                            onClick={() => deleteCollaborator(collaborator.id)}
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
