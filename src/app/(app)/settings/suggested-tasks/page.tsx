
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

export default function SuggestedTasksPage() {
    const { services, suggestedTasks, addSuggestedTask, updateSuggestedTask, deleteSuggestedTask } = useWorkOrders();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<SuggestedTask | null>(null);
    const [activeTab, setActiveTab] = React.useState(services.find(s => s.status === 'Activa')?.name.toLowerCase() || '');
    const [inlineAddTaskToPhase, setInlineAddTaskToPhase] = React.useState<string | null>(null);
    const [newTaskName, setNewTaskName] = React.useState('');

    const handleSave = (task: Omit<SuggestedTask, 'id'> | SuggestedTask) => {
        if ('id' in task) {
            updateSuggestedTask(task.id, task);
        } else {
            // This path is now only for the dialog-based editing/saving, not creating.
        }
    };
    
    const handleSaveNewTask = () => {
        if (!newTaskName.trim() || !inlineAddTaskToPhase || !activeTab) return;

        const realTasks = suggestedTasks.filter(t => !t.isPhase);
        const phaseTasks = realTasks.filter(t => t.phase === inlineAddTaskToPhase);
        const maxOrderInPhase = Math.max(...phaseTasks.map(t => t.order || 0), 0);
      
        const newTask: Omit<SuggestedTask, 'id'> = {
            name: newTaskName,
            category: activeTab,
            phase: inlineAddTaskToPhase,
            order: maxOrderInPhase + 1
        };

        addSuggestedTask(newTask);
        setNewTaskName('');
        setInlineAddTaskToPhase(null);
    };

    const handleEdit = (task: SuggestedTask) => {
        setSelectedTask(task);
        setDialogOpen(true);
    };
    
    const handleAddNewTaskClick = (phaseName: string) => {
        setInlineAddTaskToPhase(phaseName);
        setNewTaskName('');
    };
    
    const handleCancelNewTask = () => {
        setInlineAddTaskToPhase(null);
        setNewTaskName('');
    };

    const availableCategories = services.filter(s => s.status === 'Activa');

    const groupedAndSortedTasks = React.useCallback((categoryKey: string) => {
        const normalizeString = (str: string) => {
            if (!str) return '';
            return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        const normalizedCategoryKey = normalizeString(categoryKey);

        const tasksForCategory = suggestedTasks.filter(t => normalizeString(t.category) === normalizedCategoryKey);
        
        const seen = new Set();
        const uniqueTasksForCategory = tasksForCategory.filter(t => {
            if (seen.has(t.name)) {
                return false;
            } else {
                seen.add(t.name);
                return true;
            }
        });

        const grouped = uniqueTasksForCategory.reduce((acc, task) => {
            const phase = task.phase || 'Sin Fase';
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(task);
            return acc;
        }, {} as Record<string, SuggestedTask[]>);

        for (const phase in grouped) {
            grouped[phase].sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        const sortedPhases = Object.keys(grouped).sort((a, b) => {
            const firstTaskOrderA = grouped[a][0]?.order || 0;
            const firstTaskOrderB = grouped[b][0]?.order || 0;
            return firstTaskOrderA - firstTaskOrderB;
        });

        return { grouped, sortedPhases };
    }, [suggestedTasks]);

    const existingPhases = React.useMemo(() => {
        const normalizeString = (str: string) => {
            if (!str) return '';
            return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        }
        const normalizedCategoryKey = normalizeString(activeTab);
        const tasksForCategory = suggestedTasks.filter(t => normalizeString(t.category) === normalizedCategoryKey);
        const phases = new Set(tasksForCategory.map(t => t.phase).filter(Boolean));
        return Array.from(phases) as string[];
    }, [activeTab, suggestedTasks]);


    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                     <h1 className="text-3xl font-headline font-bold tracking-tight">Tareas Sugeridas para Gantt</h1>
                     <p className="text-muted-foreground">Gestiona las tareas predefinidas que se pueden cargar en las Cartas Gantt.</p>
                </div>
            </div>
            
            <Card>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <CardHeader>
                        <ScrollArea>
                            <TabsList>
                                {availableCategories.map(category => (
                                    <TabsTrigger key={category.id} value={category.name.toLowerCase()}>
                                        {category.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                        {availableCategories.map(category => {
                            const categoryKey = category.name.toLowerCase();
                            const { grouped, sortedPhases } = groupedAndSortedTasks(categoryKey);

                            return (
                                <TabsContent key={category.id} value={categoryKey}>
                                    {sortedPhases.length > 0 ? (
                                        sortedPhases.map((phase) => (
                                            <div key={phase} className="mb-6">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-lg text-primary">{phase}</h3>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleAddNewTaskClick(phase)}>
                                                        <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-primary"/>
                                                    </Button>
                                                </div>
                                                <div className="rounded-md border">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Nombre de la Tarea</TableHead>
                                                                <TableHead className="w-[100px] text-right">Acciones</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {grouped[phase].map((task) => (
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
                                                {inlineAddTaskToPhase === phase && (
                                                    <div className="mt-2 p-2 border rounded-lg bg-muted/50">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                placeholder="Nombre de la nueva tarea..."
                                                                value={newTaskName}
                                                                onChange={(e) => setNewTaskName(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <Button size="sm" onClick={handleSaveNewTask}>Guardar</Button>
                                                            <Button size="sm" variant="ghost" onClick={handleCancelNewTask}>Cancelar</Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-muted-foreground p-8 border rounded-lg">
                                            No hay tareas sugeridas para esta categoría.
                                        </div>
                                    )}
                                </TabsContent>
                            )
                        })}
                    </CardContent>
                </Tabs>
            </Card>

            <SuggestedTaskFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                task={selectedTask}
                categories={availableCategories}
                existingPhases={existingPhases}
            />
        </div>
    );
}

    