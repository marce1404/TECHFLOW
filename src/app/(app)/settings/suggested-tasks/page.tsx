
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SuggestedTasksPage() {
    const { services, suggestedTasks, addSuggestedTask, updateSuggestedTask, deleteSuggestedTask } = useWorkOrders();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<SuggestedTask | null>(null);

    const handleSave = (task: Omit<SuggestedTask, 'id'> | SuggestedTask) => {
        if ('id' in task) {
            updateSuggestedTask(task.id, task);
        } else {
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

    const availableCategories = services.filter(s => s.status === 'Activa');

    const groupedTasks = React.useMemo(() => {
        const result: Record<string, Record<string, SuggestedTask[]>> = {};
        for (const task of suggestedTasks) {
            const categoryKey = task.category.toLowerCase();
            if (!result[categoryKey]) {
                result[categoryKey] = {};
            }
            if (!result[categoryKey][task.phase]) {
                result[categoryKey][task.phase] = [];
            }
            result[categoryKey][task.phase].push(task);
        }
        // Sort tasks within each phase by the 'order' field
        for (const category in result) {
            for (const phase in result[category]) {
                result[category][phase].sort((a, b) => (a.order || 0) - (b.order || 0));
            }
        }
        return result;
    }, [suggestedTasks]);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-headline font-bold tracking-tight">Tareas Sugeridas para Gantt</h1>
                     <p className="text-muted-foreground">Gestiona las tareas predefinidas que se pueden cargar en las Cartas Gantt.</p>
                </div>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Tarea
                </Button>
            </div>
            
            <Card>
                <Tabs defaultValue={availableCategories[0]?.name.toLowerCase() || ''}>
                    <TabsList className="m-4">
                        {availableCategories.map(category => (
                            <TabsTrigger key={category.id} value={category.name.toLowerCase()}>
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    {availableCategories.map(category => {
                        const categoryKey = category.name.toLowerCase();
                        const tasksForCategory = groupedTasks[categoryKey];

                        if (!tasksForCategory) {
                             return (
                                <TabsContent key={category.id} value={categoryKey}>
                                    <div className="text-center text-muted-foreground p-8 border rounded-lg m-4">
                                        No hay tareas sugeridas para esta categoría.
                                    </div>
                                </TabsContent>
                            );
                        }
                        
                        // Get unique phases and sort them based on the minimum order number of tasks within that phase
                        const sortedPhases = Object.keys(tasksForCategory).sort((a, b) => {
                            const minOrderA = Math.min(...tasksForCategory[a].map(t => t.order || 0));
                            const minOrderB = Math.min(...tasksForCategory[b].map(t => t.order || 0));
                            return minOrderA - minOrderB;
                        });

                        return (
                            <TabsContent key={category.id} value={categoryKey} className="m-0">
                                <CardContent className="space-y-4 pt-0">
                                    {sortedPhases.map(phase => {
                                        const tasks = tasksForCategory[phase];
                                        return (
                                            <div key={phase}>
                                                <h3 className="font-semibold text-lg mb-2 text-primary">{phase}</h3>
                                                <div className="rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Nombre de la Tarea</TableHead>
                                                                <TableHead className="w-[100px] text-right">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {tasks.map((task) => (
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
                                            </div>
                                        )
                                    })}
                                </CardContent>
                            </TabsContent>
                        )
                    })}
                </Tabs>
            </Card>


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
