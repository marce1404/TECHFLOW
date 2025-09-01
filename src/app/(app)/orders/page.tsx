
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";

export default function ActiveOrdersPage() {
    const { activeWorkOrders, historicalWorkOrders, otCategories } = useWorkOrders();
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = React.useState('todos');
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
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
    
    const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

    const handleAdvancedFilterChange = React.useCallback((newAdvancedFilters: Omit<Filters, 'search'>) => {
        setFilters(prev => ({
            ...prev,
            ...newAdvancedFilters
        }));
    }, []);

    const filterOrders = (categoryPrefix: string | null) => {
        setActiveTab(categoryPrefix || 'todos');
    };
    
    const filteredOrders = React.useMemo(() => {
        const allOrders = [...activeWorkOrders, ...historicalWorkOrders];
        let orders = allOrders;

        if (activeTab !== 'todos') {
            orders = orders.filter(order => order.ot_number.startsWith(activeTab));
        }

        // Simple search
        if (filters.search) {
             orders = orders.filter(order =>
                order.ot_number.toLowerCase().includes(filters.search.toLowerCase()) ||
                order.description.toLowerCase().includes(filters.search.toLowerCase()) ||
                order.client.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        // Apply advanced filters
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
    }, [activeWorkOrders, historicalWorkOrders, activeTab, filters]);

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
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
        }).format(value);
    }
    
    const { totalPorFacturar, totalFacturado } = React.useMemo(() => {
        return filteredOrders.reduce((acc, order) => {
            if (order.facturado) {
                acc.totalFacturado += order.netPrice;
            } else {
                acc.totalPorFacturar += order.netPrice;
            }
            return acc;
        }, { totalPorFacturar: 0, totalFacturado: 0 });
    }, [filteredOrders]);

    return (
        <div className="flex flex-col gap-4">
             <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="space-y-2">
                <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <ChevronsUpDown className="h-4 w-4 mr-2" />
                            Filtros Avanzados
                        </Button>
                    </CollapsibleTrigger>
                     {canCreate && (
                        <Button asChild size="sm">
                            <Link href="/orders/new">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nueva OT
                            </Link>
                        </Button>
                    )}
                </div>
                <CollapsibleContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>Filtros Avanzados</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <AdvancedFilters onFilterChange={handleAdvancedFilterChange} filters={filters} />
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
            
            <Card>
                <CardHeader>
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
                             <div className="w-full sm:w-auto sm:max-w-sm">
                                <Input
                                    placeholder="Buscar por OT, cliente, descripción..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                                />
                            </div>
                        </div>
                        <TabsContent value={activeTab} className="mt-4">
                            <OrdersTable orders={filteredOrders} />
                        </TabsContent>
                    </Tabs>
                </CardHeader>
                 <CardFooter className="flex-col items-start gap-2 pt-4 border-t">
                    <div className="flex justify-between w-full">
                        <span className="font-semibold text-muted-foreground">Total Por Facturar (Neto):</span>
                        <span className="font-bold text-lg">{formatCurrency(totalPorFacturar)}</span>
                    </div>
                    <div className="flex justify-between w-full">
                        <span className="font-semibold text-muted-foreground">Total Facturado (Neto):</span>
                        <span className="font-bold text-lg text-green-600">{formatCurrency(totalFacturado)}</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
