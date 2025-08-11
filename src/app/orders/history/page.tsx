

'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";


export default function HistoryPage() {
    const { historicalWorkOrders, otCategories } = useWorkOrders();
    const [filteredOrders, setFilteredOrders] = React.useState<WorkOrder[]>(historicalWorkOrders);


    const filterOrders = (categoryPrefix: string | null) => {
        if (!categoryPrefix || categoryPrefix === 'todos') {
            setFilteredOrders(historicalWorkOrders);
            return;
        }
        setFilteredOrders(historicalWorkOrders.filter(order => order.ot_number.startsWith(categoryPrefix)));
    }
    
    React.useEffect(() => {
        setFilteredOrders(historicalWorkOrders);
    }, [historicalWorkOrders]);

    const categories = [
        { value: "todos", label: "Todos", prefix: 'todos' },
        ...otCategories
            .map(cat => ({
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
            <Tabs defaultValue="todos" onValueChange={filterOrders}>
              <TabsList>
                {categories.map(cat => (
                    <TabsTrigger key={cat.value} value={cat.prefix}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
               <TabsContent value="todos">
                  <HistoricalOrdersTable orders={filteredOrders} />
              </TabsContent>
              {categories.filter(c => c.value !== 'todos').map(cat => (
                <TabsContent key={cat.value} value={cat.prefix}>
                    <HistoricalOrdersTable orders={filteredOrders} />
                </TabsContent>
              ))}
            </Tabs>
        </div>
    );
}
