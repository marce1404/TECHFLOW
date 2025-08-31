
'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AdvancedFilters, { type Filters } from '@/components/orders/advanced-filters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";


export default function HistoryPage() {
    const { historicalWorkOrders, otCategories } = useWorkOrders();
    const [activeTab, setActiveTab] = React.useState('todos');
    const [filters, setFilters] = React.useState<Filters>({
      search: '',
      clients: [],
      services: [],
      technicians: [],
      supervisors: [],
      priorities: [],
      statuses: [],
      dateRange: { from: undefined, to: undefined },
    });
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);


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
        if (filters.clients.length > 0) {
            orders = orders.filter(order => filters.clients.includes(order.client));
        }
        if (filters.services.length > 0) {
            orders = orders.filter(order => filters.services.includes(order.service));
        }
        if (filters.technicians.length > 0) {
            orders = orders.filter(order => order.technicians.some(t => filters.technicians.includes(t)));
        }
        if (filters.supervisors.length > 0) {
            orders = orders.filter(order => order.assigned.some(s => filters.supervisors.includes(s)));
        }
        if (filters.priorities.length > 0) {
            orders = orders.filter(order => filters.priorities.includes(order.priority));
        }
        if (filters.statuses.length > 0) {
            orders = orders.filter(order => filters.statuses.includes(order.status));
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
                <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <CardHeader>
                         <div className="flex items-center gap-2">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                    <ChevronsUpDown className="h-4 w-4" />
                                    <span className="sr-only">Toggle</span>
                                </Button>
                            </CollapsibleTrigger>
                            <div>
                                <CardTitle>Filtros Avanzados del Historial</CardTitle>
                                <CardDescription>Usa los filtros para encontrar órdenes de trabajo antiguas.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent>
                            <AdvancedFilters onFilterChange={setFilters} />
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
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
