
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import GanttTable from '@/components/gantt/gantt-table';

const ITEMS_PER_PAGE = 15;

export default function GanttPage() {
    const { ganttCharts, deleteGanttChart } = useWorkOrders();
    const [currentPage, setCurrentPage] = React.useState(1);

    const totalPages = Math.ceil(ganttCharts.length / ITEMS_PER_PAGE);
    const paginatedCharts = ganttCharts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

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
                   <GanttTable charts={paginatedCharts} deleteGanttChart={deleteGanttChart} />
                </CardContent>
                 {totalPages > 1 && (
                    <CardFooter>
                      <div className="text-xs text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </div>
                      <div className="flex items-center space-x-2 ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Siguiente
                        </Button>
                      </div>
                    </CardFooter>
                  )}
            </Card>
        </div>
    );
}
