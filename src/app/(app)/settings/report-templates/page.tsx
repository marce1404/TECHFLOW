
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ReportTemplate } from '@/lib/types';

export default function ReportTemplatesPage() {
    const { reportTemplates, deleteReportTemplate } = useWorkOrders();
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;


    const serviceGuides = reportTemplates.filter(t => t.type === 'service-guide');
    const projectDeliveries = reportTemplates.filter(t => t.type === 'project-delivery');
    
    const renderTable = (templates: ReportTemplate[]) => {
        const totalPages = Math.ceil(templates.length / itemsPerPage);
        const paginatedData = templates.slice(
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
        }, [templates]);

        return (
            <>
                <div className="rounded-b-lg border-t">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Nombre de la Plantilla</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Nº de Campos</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length > 0 ? (
                                paginatedData.map((template) => (
                                    <TableRow key={template.id}>
                                        <TableCell className="font-medium">{template.name}</TableCell>
                                        <TableCell>{template.description}</TableCell>
                                        <TableCell>{template.fields.length}</TableCell>
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
                                                            <Link href={`/settings/report-templates/${template.id}/edit`}>
                                                                <Edit className="mr-2 h-4 w-4" /> Ver/Editar
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/settings/report-templates/${template.id}/preview`} target="_blank">
                                                                <Eye className="mr-2 h-4 w-4" /> Ver Plantilla
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
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente la plantilla
                                                            <span className="font-bold"> {template.name}</span>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            onClick={() => deleteReportTemplate(template.id)}
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
                                        No se han creado plantillas de este tipo todavía.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 text-sm text-muted-foreground border-t">
                        <div>
                             Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, templates.length)} de {templates.length} plantillas.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                            <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                        </div>
                    </div>
                )}
            </>
        )
    };

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Plantillas de Informes y Guías</CardTitle>
                        <CardDescription>Crea y gestiona los formatos que los técnicos llenarán en terreno.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/settings/report-templates/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nueva Plantilla
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="service-guides">
                        <div className="border-b px-4">
                            <TabsList className="bg-transparent p-0">
                                <TabsTrigger value="service-guides">Guías de Servicio</TabsTrigger>
                                <TabsTrigger value="project-deliveries">Entrega de Proyectos</TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="service-guides" className="m-0">
                            {renderTable(serviceGuides)}
                        </TabsContent>
                        <TabsContent value="project-deliveries" className="m-0">
                            {renderTable(projectDeliveries)}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
