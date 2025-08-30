
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import GanttTable from '@/components/gantt/gantt-table';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 15;

export default function GanttPage() {
    const { ganttCharts, deleteGanttChart } = useWorkOrders();
    const [search, setSearch] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);

    const filteredCharts = React.useMemo(() => {
        return ganttCharts.filter(chart => 
            chart.name.toLowerCase().includes(search.toLowerCase()) ||
            (chart.assignedOT && chart.assignedOT.toLowerCase().includes(search.toLowerCase()))
        );
    }, [ganttCharts, search]);

    const totalPages = Math.ceil(filteredCharts.length / ITEMS_PER_PAGE);
    const paginatedCharts = filteredCharts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                    <CardTitle>Cartas Gantt Creadas</CardTitle>
                    <div className="flex w-full sm:w-auto items-center gap-2">
                        <Input
                            placeholder="Buscar por nombre, OT..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:max-w-xs"
                        />
                        <Button asChild>
                            <Link href="/gantt/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nueva Carta Gantt
                            </Link>
                        </Button>
                    </div>
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
