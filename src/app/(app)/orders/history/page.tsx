

'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";


export default function HistoryPage() {
    const { historicalWorkOrders, otCategories } = useWorkOrders();
    const [filteredOrders, setFilteredOrders] = React.useState<WorkOrder[]>(historicalWorkOrders);
    const [activeTab, setActiveTab] = React.useState('todos');


    const filterOrders = (categoryPrefix: string | null) => {
        setActiveTab(categoryPrefix || 'todos');
        if (!categoryPrefix || categoryPrefix === 'todos') {
            setFilteredOrders(historicalWorkOrders);
            return;
        }
        setFilteredOrders(historicalWorkOrders.filter(order => order.ot_number.startsWith(categoryPrefix)));
    }
    
    React.useEffect(() => {
        setFilteredOrders(historicalWorkOrders);
        setActiveTab('todos');
    }, [historicalWorkOrders]);

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
            <h1 className="text-3xl font-headline font-bold tracking-tight">
                Historial de Órdenes de Trabajo
            </h1>
            <Tabs value={activeTab} onValueChange={filterOrders}>
                <ScrollArea className="w-full">
                    <TabsList className="w-max">
                        {categories.map(cat => (
                            <TabsTrigger key={cat.id} value={cat.prefix}>{cat.label}</TabsTrigger>
                        ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
              <TabsContent value={activeTab} className="mt-4">
                  <HistoricalOrdersTable orders={filteredOrders} />
              </TabsContent>
            </Tabs>
        </div>
    );
}
