
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
} from "@/components/ui/alert-dialog";
import type { GanttChart } from '@/lib/types';
import { CardFooter } from '../ui/card';

interface GanttTableProps {
    charts: GanttChart[];
    deleteGanttChart: (id: string) => void;
}

export default function GanttTable({ charts, deleteGanttChart }: GanttTableProps) {
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;

    const totalPages = Math.ceil(charts.length / itemsPerPage);
    const paginatedData = charts.slice(
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
    }, [charts]);

    return (
        <div>
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Nº de Tareas</TableHead>
                        <TableHead>OT Asociada</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedData.length > 0 ? (
                        paginatedData.map((chart) => (
                            <TableRow key={chart.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/gantt/${chart.id}/edit`} className="text-primary hover:underline">
                                        {chart.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{chart.tasks.length}</TableCell>
                                <TableCell>{chart.assignedOT || 'N/A'}</TableCell>
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
                                                    <Link href={`/gantt/${chart.id}/edit`}>
                                                        <Edit className="mr-2 h-4 w-4" /> Ver/Editar
                                                    </Link>
                                                </DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                            <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. Esto eliminará permanentemente la carta gantt
                                                <span className="font-bold"> {chart.name}</span>.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive hover:bg-destructive/90"
                                                onClick={() => deleteGanttChart(chart.id)}
                                            >
                                                Eliminar
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                No se han creado cartas Gantt todavía.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
             {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between p-4 text-sm text-muted-foreground border-t">
                    <div>
                        Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, charts.length)} de {charts.length} cartas.
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                        <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                        <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                    </div>
                </CardFooter>
            )}
        </div>
    );
}
