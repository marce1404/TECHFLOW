
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import GanttTable from '@/components/gantt/gantt-table';

export default function GanttPage() {
    const { ganttCharts, deleteGanttChart } = useWorkOrders();

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Cartas Gantt Creadas</CardTitle>
                    <Button asChild>
                        <Link href="/gantt/new">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nueva Carta Gantt
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                   <GanttTable charts={ganttCharts} deleteGanttChart={deleteGanttChart} />
                </CardContent>
            </Card>
        </div>
    );
}
