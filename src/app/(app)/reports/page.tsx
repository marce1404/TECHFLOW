
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWorkOrders } from '@/context/work-orders-context';
import type { WorkOrder } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FilePlus2, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function ReportsPage() {
  const { activeWorkOrders, historicalWorkOrders, otCategories, submittedReports } = useWorkOrders();
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('todos');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;


  const filterOrders = (categoryPrefix: string | null) => {
    setActiveTab(categoryPrefix || 'todos');
  };
  
  const submittedOtIds = React.useMemo(() => new Set(submittedReports.map(r => r.workOrderId)), [submittedReports]);

  const filteredOrders = React.useMemo(() => {
    const allWorkOrders = [...activeWorkOrders, ...historicalWorkOrders];
    let orders = allWorkOrders.filter(order => !submittedOtIds.has(order.id));

    if (activeTab !== 'todos') {
        orders = orders.filter(order => order.ot_number.startsWith(activeTab));
    }
    if (search) {
        orders = orders.filter(order =>
            order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
            order.description.toLowerCase().includes(search.toLowerCase()) ||
            order.client.toLowerCase().includes(search.toLowerCase())
        );
    }
    return orders;
  }, [activeWorkOrders, historicalWorkOrders, activeTab, search, submittedOtIds]);
  
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
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
  }, [activeTab, search]);

  const categories = [
    { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
    ...otCategories
        .map(cat => ({
            id: cat.id,
            value: cat.prefix,
            label: `${cat.name} (${cat.prefix})`,
            prefix: cat.prefix,
        }))
  ];

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Generar Informe o Guía de Servicio</CardTitle>
          <CardDescription>
            Selecciona una Orden de Trabajo activa para completar su informe o guía correspondiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={activeTab} onValueChange={filterOrders}>
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                    <ScrollArea className="w-full sm:w-auto">
                        <TabsList className="w-max">
                            {categories.map(cat => (
                                <TabsTrigger key={cat.id} value={cat.prefix}>{cat.label}</TabsTrigger>
                            ))}
                        </TabsList>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    <div className="flex w-full sm:w-auto items-center gap-2">
                        <Input
                            placeholder="Buscar por ID, cliente, servicio..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:max-w-sm"
                        />
                    </div>
                </div>
              <TabsContent value={activeTab}>
                 <div className="hidden md:block">
                    <div className="rounded-md border">
                        <Table>
                        <TableHeader>
                            <TableRow>
                            <TableHead>Nº OT</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedOrders.length > 0 ? (
                            paginatedOrders.map((order: WorkOrder) => (
                                <TableRow key={order.id}>
                                <TableCell>{order.ot_number}</TableCell>
                                <TableCell>{order.description}</TableCell>
                                <TableCell>{order.client}</TableCell>
                                <TableCell className="text-right">
                                    <Button asChild>
                                    <Link href={`/reports/new?ot_number=${order.ot_number}`}>
                                        <FilePlus2 className="mr-2 h-4 w-4" />
                                        Llenar Informe
                                    </Link>
                                    </Button>
                                </TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                No hay órdenes de trabajo pendientes de informe que coincidan con tu búsqueda.
                                </TableCell>
                            </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                  </div>
                   <div className="md:hidden space-y-4">
                    {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((order) => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <CardTitle className="text-base">{order.ot_number}</CardTitle>
                                    <CardDescription>{order.client}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{order.description}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/reports/new?ot_number=${order.ot_number}`}>
                                            <FilePlus2 className="mr-2 h-4 w-4" />
                                            Llenar Informe
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            No hay órdenes de trabajo pendientes de informe que coincidan con tu búsqueda.
                        </div>
                    )}
                </div>
                 {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                        <div>
                            Mostrando {paginatedOrders.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredOrders.length)} de {filteredOrders.length} órdenes.
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                            <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                        </div>
                    </div>
                )}
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
