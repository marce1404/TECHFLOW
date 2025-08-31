
'use client';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/auth-context";
import AdvancedFilters, { type Filters } from '@/components/orders/advanced-filters';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActiveOrdersPage() {
    const { activeWorkOrders, otCategories } = useWorkOrders();
    const { userProfile } = useAuth();
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
        if (filters.client) {
            orders = orders.filter(order => order.client === filters.client);
        }
        if (filters.service) {
            orders = orders.filter(order => order.service === filters.service);
        }
        if (filters.technician) {
            orders = orders.filter(order => order.technicians.includes(filters.technician));
        }
        if (filters.supervisor) {
            orders = orders.filter(order => order.assigned.includes(filters.supervisor));
        }
        if (filters.priority) {
            orders = orders.filter(order => order.priority === filters.priority);
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
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <CardTitle>Órdenes de Trabajo Activas</CardTitle>
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
                    <OrdersTable orders={filteredOrders} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
