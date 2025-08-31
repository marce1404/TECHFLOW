
'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AdvancedFilters, { type Filters } from '@/components/orders/advanced-filters';


export default function HistoryPage() {
    const { historicalWorkOrders, otCategories } = useWorkOrders();
    const [activeTab, setActiveTab] = React.useState('todos');
    const [filters, setFilters] = React.useState<Filters>({
      search: '',
      client: '',
      service: '',
      technician: '',
      supervisor: '',
      priority: '',
      dateRange: { from: undefined, to: undefined },
    });


    const filterOrders = (categoryPrefix: string | null) => {
        setActiveTab(categoryPrefix || 'todos');
    }
    
    const filteredOrders = React.useMemo(() => {
        let orders = historicalWorkOrders;

        if (activeTab !== 'todos') {
            orders = orders.filter(order => order.ot_number.startsWith(activeTab));
        }
        
        // Apply advanced filters
        if (filters.search) {
            orders = orders.filter(order =>
                order.ot_number.toLowerCase().includes(filters.search.toLowerCase()) ||
                order.description.toLowerCase().includes(filters.search.toLowerCase())
            );
        }
        if (filters.client && filters.client !== 'all') {
            orders = orders.filter(order => order.client === filters.client);
        }
        if (filters.service && filters.service !== 'all') {
            orders = orders.filter(order => order.service === filters.service);
        }
        if (filters.technician && filters.technician !== 'all') {
            orders = orders.filter(order => order.technicians.includes(filters.technician));
        }
        if (filters.supervisor && filters.supervisor !== 'all') {
            orders = orders.filter(order => order.assigned.includes(filters.supervisor));
        }
        if (filters.priority && filters.priority !== 'all') {
            orders = orders.filter(order => order.priority === filters.priority);
        }
        if (filters.dateRange.from) {
            orders = orders.filter(order => new Date(order.date.replace(/-/g, '/')) >= filters.dateRange.from!);
        }
        if (filters.dateRange.to) {
            orders = orders.filter(order => new Date(order.date.replace(/-/g, '/')) <= filters.dateRange.to!);
        }

        return orders;
    }, [historicalWorkOrders, activeTab, filters]);


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
                    <CardTitle>Filtros Avanzados del Historial</CardTitle>
                    <CardDescription>Usa los filtros para encontrar órdenes de trabajo antiguas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AdvancedFilters onFilterChange={setFilters} />
                </CardContent>
            </Card>

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
