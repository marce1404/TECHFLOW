
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
                                {otCategories.map((category) => (
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
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
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
