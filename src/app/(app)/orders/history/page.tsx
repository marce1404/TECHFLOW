

'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";


export default function HistoryPage() {
    const { historicalWorkOrders, otCategories } = useWorkOrders();
    const [search, setSearch] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('todos');


    const filterOrders = (categoryPrefix: string | null) => {
        setActiveTab(categoryPrefix || 'todos');
    }
    
    const filteredOrders = React.useMemo(() => {
        let orders = historicalWorkOrders;
        if (activeTab !== 'todos') {
            orders = orders.filter(order => order.ot_number.startsWith(activeTab));
        }
        if (search) {
            orders = orders.filter(order =>
                order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
                order.description.toLowerCase().includes(search.toLowerCase()) ||
                order.client.toLowerCase().includes(search.toLowerCase()) ||
                order.service.toLowerCase().includes(search.toLowerCase())
            );
        }
        return orders;
    }, [historicalWorkOrders, activeTab, search]);


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
             <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Historial de Órdenes de Trabajo
                </h1>
            </div>
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
                    <Input
                        placeholder="Buscar por ID, cliente, servicio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:max-w-sm"
                    />
                </div>
              <TabsContent value={activeTab} className="mt-4">
                  <HistoricalOrdersTable orders={filteredOrders} />
              </TabsContent>
            </Tabs>
        </div>
    );
}
