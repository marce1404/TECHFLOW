
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useWorkOrders } from '@/context/work-orders-context';
import type { SuggestedTask, Service } from '@/lib/types';
import { SuggestedTaskFormDialog } from '@/components/settings/suggested-task-form-dialog';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function SuggestedTasksPage() {
    const { services, suggestedTasks, addSuggestedTask, updateSuggestedTask, deleteSuggestedTask } = useWorkOrders();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<SuggestedTask | null>(null);

    const handleSave = (task: Omit<SuggestedTask, 'id'> | SuggestedTask) => {
        if ('id' in task) {
            updateSuggestedTask(task.id, task);
        } else {
            // Assign a high order number to new tasks to place them at the end
            const newOrder = Math.max(...suggestedTasks.map(t => t.order || 0), 0) + 1;
            addSuggestedTask({ ...task, order: newOrder });
        }
    };

    const handleEdit = (task: SuggestedTask) => {
        setSelectedTask(task);
        setDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedTask(null);
        setDialogOpen(true);
    };

    const groupedTasks = React.useMemo(() => {
        return suggestedTasks.reduce((acc, task) => {
            if (!acc[task.category]) {
                acc[task.category] = [];
            }
            acc[task.category].push(task);
            // Sort tasks within the category by the 'order' field
            acc[task.category].sort((a, b) => (a.order || 0) - (b.order || 0));
            return acc;
        }, {} as Record<string, SuggestedTask[]>);
    }, [suggestedTasks]);


    const availableCategories = services.filter(s => s.status === 'Activa');

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-end">
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Tarea
                </Button>
            </div>
            
            <div className="space-y-6">
                {Object.keys(groupedTasks).sort().map(category => (
                    <Card key={category}>
                        <CardHeader>
                            <CardTitle>{services.find(s => s.name.toLowerCase() === category)?.name || category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre de la Tarea</TableHead>
                                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {groupedTasks[category].map((task) => (
                                            <TableRow key={task.id}>
                                                <TableCell>{task.name}</TableCell>
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
                                                                <DropdownMenuItem onClick={() => handleEdit(task)}>
                                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
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
                                                                Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea
                                                                <span className="font-bold"> {task.name}</span>.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className="bg-destructive hover:bg-destructive/90"
                                                                onClick={() => deleteSuggestedTask(task.id)}
                                                            >
                                                                Eliminar
                                                            </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                 {Object.keys(groupedTasks).length === 0 && (
                    <div className="text-center text-muted-foreground p-8 border rounded-lg">
                        No hay tareas sugeridas. ¡Añade una para empezar!
                    </div>
                 )}
            </div>

            <SuggestedTaskFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                task={selectedTask}
                categories={availableCategories}
            />
        </div>
    );
}
