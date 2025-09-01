
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
    const { activeWorkOrders, otCategories } = useWorkOrders();
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = React.useState('todos');
    const [search, setSearch] = React.useState('');
    const [advancedFilters, setAdvancedFilters] = React.useState<Omit<Filters, 'search'>>({
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

        // Simple search
        if (search) {
             orders = orders.filter(order =>
                order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
                order.description.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Apply advanced filters
        if (advancedFilters.clients.length > 0) {
            orders = orders.filter(order => advancedFilters.clients.includes(order.client));
        }
        if (advancedFilters.services.length > 0) {
            orders = orders.filter(order => advancedFilters.services.includes(order.service));
        }
        if (advancedFilters.technicians.length > 0) {
            orders = orders.filter(order => order.technicians.some(t => advancedFilters.technicians.includes(t)));
        }
        if (advancedFilters.supervisors.length > 0) {
            orders = orders.filter(order => order.assigned.some(s => advancedFilters.supervisors.includes(s)));
        }
        if (advancedFilters.priorities.length > 0) {
            orders = orders.filter(order => advancedFilters.priorities.includes(order.priority));
        }
        if (advancedFilters.statuses.length > 0) {
            orders = orders.filter(order => advancedFilters.statuses.includes(order.status));
        }
        if (advancedFilters.dateRange.from) {
            orders = orders.filter(order => new Date(order.date.replace(/-/g, '/')) >= advancedFilters.dateRange.from!);
        }
        if (advancedFilters.dateRange.to) {
            orders = orders.filter(order => new Date(order.date.replace(/-/g, '/')) <= advancedFilters.dateRange.to!);
        }

        return orders;
    }, [activeWorkOrders, activeTab, search, advancedFilters]);

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
                            <AdvancedFilters onFilterChange={setAdvancedFilters} />
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>
            
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
                                    placeholder="Buscar por OT o descripción..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
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
