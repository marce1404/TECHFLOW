
'use client';
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronsUpDown } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import AdvancedFilters, { type Filters } from '@/components/orders/advanced-filters';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ActiveOrdersPage() {
    const { activeWorkOrders, otCategories } = useWorkOrders();
    const { userProfile } = useAuth();
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
    
    const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

    const filterOrders = (categoryPrefix: string | null) => {
        setActiveTab(categoryPrefix || 'todos');
    };
    
    const filteredOrders = React.useMemo(() => {
        let orders = activeWorkOrders;

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
    }, [activeWorkOrders, activeTab, filters]);

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
                <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        <ChevronsUpDown className="h-4 w-4" />
                                        <span className="sr-only">Toggle</span>
                                    </Button>
                                </CollapsibleTrigger>
                                <CardTitle>Filtros Avanzados</CardTitle>
                            </div>
                            {canCreate && (
                                <Button asChild>
                                    <Link href="/orders/new">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Nueva OT
                                    </Link>
                                </Button>
                            )}
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
                    <OrdersTable orders={filteredOrders} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
