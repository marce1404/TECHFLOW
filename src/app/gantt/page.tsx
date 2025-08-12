
'use client';

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GanttChart } from "lucide-react";

export default function GanttPage() {
    const { ganttCharts } = useWorkOrders();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Cartas Gantt
                </h1>
                <Button asChild>
                    <Link href="/gantt/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva Carta Gantt
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Cartas Gantt Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Nº de Tareas</TableHead>
                                    <TableHead>OT Asociada</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ganttCharts.length > 0 ? (
                                    ganttCharts.map((chart) => (
                                        <TableRow key={chart.id}>
                                            <TableCell className="font-medium">{chart.name}</TableCell>
                                            <TableCell>{chart.tasks.length}</TableCell>
                                            <TableCell>{chart.assignedOT || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/gantt/${chart.id}/edit`}>
                                                        <GanttChart className="mr-2 h-4 w-4" />
                                                        Ver/Editar
                                                    </Link>
                                                </Button>
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
