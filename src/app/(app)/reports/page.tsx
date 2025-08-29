
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
  const { activeWorkOrders, otCategories, submittedReports } = useWorkOrders();
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('todos');

  const filterOrders = (categoryPrefix: string | null) => {
    setActiveTab(categoryPrefix || 'todos');
  };
  
  const submittedOtIds = React.useMemo(() => new Set(submittedReports.map(r => r.workOrderId)), [submittedReports]);

  const filteredOrders = React.useMemo(() => {
    let orders = activeWorkOrders.filter(order => !submittedOtIds.has(order.id));

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
  }, [activeWorkOrders, activeTab, search, submittedOtIds]);
  
  const categories = [
    { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
    ...otCategories
        .filter(cat => cat.status === 'Activa')
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
                            {filteredOrders.length > 0 ? (
                            filteredOrders.map((order: WorkOrder) => (
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
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
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
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
