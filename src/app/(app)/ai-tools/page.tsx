
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResourceSuggester from "@/components/ai/resource-suggester";
import GanttTaskSuggester from "@/components/ai/gantt-task-suggester";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AiToolsPage() {
    return (
        <Tabs defaultValue="resource-assignment" className="w-full">
            <div className="flex justify-center mb-6">
                 <TabsList>
                    <TabsTrigger value="resource-assignment">Sugerir Recursos</TabsTrigger>
                    <TabsTrigger value="gantt-suggester">Sugerir Tareas Gantt</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="resource-assignment">
                <Card>
                    <CardHeader>
                        <CardTitle>Asistente de Asignación de Recursos</CardTitle>
                        <CardDescription>
                            Describe los requerimientos de la tarea para recibir sugerencias de técnicos y vehículos óptimos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResourceSuggester />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="gantt-suggester">
                 <Card>
                    <CardHeader>
                        <CardTitle>Asistente de Creación de Tareas Gantt</CardTitle>
                        <CardDescription>
                            Describe tu proyecto para recibir una propuesta estructurada de tareas y fases para tu Carta Gantt.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <GanttTaskSuggester />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
