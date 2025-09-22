
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
import AdvancedFilters, { type ActiveFilter } from '@/components/orders/advanced-filters';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { normalizeString } from "@/lib/utils";
import type { WorkOrder } from "@/lib/types";
import { DateRange } from "react-day-picker";

export default function ActiveOrdersPage() {
    const { workOrders, otCategories } = useWorkOrders();
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = React.useState('todos');
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);
    
    const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

    const activeItems = React.useMemo(() => {
        return workOrders.filter(o => normalizeString(o.status) !== 'cerrada');
    }, [workOrders]);

    const activeWorkOrders = React.useMemo(() => activeItems.filter(item => !item.isActivity), [activeItems]);
    const activeActivities = React.useMemo(() => activeItems.filter(item => item.isActivity), [activeItems]);
    
    const filteredOrders = React.useMemo(() => {
        let baseItems: WorkOrder[];

        if (activeTab === 'actividades') {
            baseItems = activeActivities;
        } else if (activeTab === 'todos') {
            baseItems = activeWorkOrders;
        } else {
            baseItems = activeWorkOrders.filter(order => order.ot_number.startsWith(activeTab));
        }

        let ordersToFilter = baseItems;
        if (search) {
             ordersToFilter = baseItems.filter(order =>
                order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
                (order.description && order.description.toLowerCase().includes(search.toLowerCase())) ||
                (order.client && order.client.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // Apply date range
        if (dateRange?.from) {
            ordersToFilter = ordersToFilter.filter(order => new Date(order.date.replace(/-/g, '/')) >= dateRange.from!);
        }
        if (dateRange?.to) {
            ordersToFilter = ordersToFilter.filter(order => new Date(order.date.replace(/-/g, '/')) <= dateRange.to!);
        }

        // Apply advanced filters from activeFilters state
        activeFilters.forEach(filter => {
            switch (filter.type) {
                case 'clients':
                    ordersToFilter = ordersToFilter.filter(order => filter.values.includes(order.client));
                    break;
                case 'services':
                    ordersToFilter = ordersToFilter.filter(order => filter.values.includes(order.service));
                    break;
                case 'technicians':
                    ordersToFilter = ordersToFilter.filter(order => (order.technicians || []).some(t => filter.values.includes(t)));
                    break;
                case 'supervisors':
                    ordersToFilter = ordersToFilter.filter(order => (order.assigned || []).some(s => filter.values.includes(s)));
                    break;
                case 'priorities':
                    ordersToFilter = ordersToFilter.filter(order => filter.values.includes(order.priority));
                    break;
                case 'statuses':
                    ordersToFilter = ordersToFilter.filter(order => filter.values.includes(order.status));
                    break;
                case 'invoicedStatus':
                     ordersToFilter = ordersToFilter.filter(order => {
                        const totalInvoiced = (order.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
                        const netPrice = order.netPrice || 0;
                        const status = filter.values[0];

                        if (status === 'invoiced') {
                            return totalInvoiced > 0;
                        }
                        if (status === 'not_invoiced') {
                            return netPrice > 0 && totalInvoiced < netPrice;
                        }
                        return true;
                    });
                    break;
            }
        });

        return ordersToFilter;

    }, [activeWorkOrders, activeActivities, activeTab, search, dateRange, activeFilters]);

    const categories = [
        { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
        ...otCategories
            .filter(cat => cat.status === 'Activa')
            .map(cat => ({
                id: cat.id,
                value: cat.prefix,
                label: `${cat.name} (${cat.prefix})`,
                prefix: cat.prefix,
            })),
        { id: "actividades", value: "actividades", label: "ACTIVIDADES", prefix: 'actividades' },
    ];
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
        }).format(value);
    }
    
    const { totalPorFacturar, totalFacturado } = React.useMemo(() => {
        return activeWorkOrders.reduce((acc, order) => {
            const invoicedAmount = (order.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
            const netPrice = order.netPrice || 0;
            const pendingAmount = netPrice - invoicedAmount;

            if (pendingAmount > 0) {
                acc.totalPorFacturar += pendingAmount;
            }
            
            acc.totalFacturado += invoicedAmount;

            return acc;
        }, { totalPorFacturar: 0, totalFacturado: 0 });
    }, [activeWorkOrders]);


    return (
        <div className="flex flex-col gap-4">
             <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="space-y-2">
                <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <ChevronsUpDown className="mr-2 h-4 w-4" />
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
                             <AdvancedFilters 
                                dateRange={dateRange}
                                onDateRangeChange={setDateRange}
                                activeFilters={activeFilters}
                                onActiveFiltersChange={setActiveFilters}
                             />
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>
            
            <Card>
                <CardHeader>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <TabsContent value={activeTab} className="mt-4">
                            <OrdersTable orders={filteredOrders} isActivityTab={activeTab === 'actividades'} />
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
