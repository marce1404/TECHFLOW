
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
import { useWorkOrders } from '@/context/work-orders-context';
import type { OTCategory } from '@/lib/types';
import { CategoryFormDialog } from '@/components/settings/category-form-dialog';

export default function OTCategoriesPage() {
    const { otCategories, addCategory, updateCategory } = useWorkOrders();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedCategory, setSelectedCategory] = React.useState<OTCategory | null>(null);
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;

    const handleSave = (category: Omit<OTCategory, 'id'> | OTCategory) => {
        if ('id' in category) {
            updateCategory(category.id, category);
        } else {
            addCategory(category);
        }
    };

    const handleEdit = (category: OTCategory) => {
        setSelectedCategory(category);
        setDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedCategory(null);
        setDialogOpen(true);
    };

    const handleToggleStatus = (category: OTCategory) => {
        const newStatus = category.status === 'Activa' ? 'Inactiva' : 'Activa';
        updateCategory(category.id, { ...category, status: newStatus });
    };

    const totalPages = Math.ceil(otCategories.length / itemsPerPage);
    const paginatedData = otCategories.slice(
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
                    Nueva Categoría
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Categorías Existentes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Prefijo</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length > 0 ? paginatedData.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>{category.prefix}</TableCell>
                                        <TableCell>
                                            <Badge variant={category.status === 'Activa' ? 'default' : 'outline'}>{category.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menú</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(category)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(category)}>
                                                        {category.status === 'Activa' ? 'Desactivar' : 'Activar'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No hay categorías para mostrar.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter className="flex items-center justify-between text-sm text-muted-foreground pt-6">
                        <div>
                            Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, otCategories.length)} de {otCategories.length} categorías.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                            <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
            <CategoryFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                category={selectedCategory}
            />
        </div>
    );
}
