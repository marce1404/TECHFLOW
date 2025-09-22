
'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AdvancedFilters, { type ActiveFilter } from '@/components/orders/advanced-filters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { normalizeString } from "@/lib/utils";
import { DateRange } from "react-day-picker";


export default function HistoryPage() {
    const { workOrders, otCategories } = useWorkOrders();
    const [activeTab, setActiveTab] = React.useState('todos');
    const [search, setSearch] = React.useState('');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);

    const [isFilterOpen, setIsFilterOpen] = React.useState(false);


    const filteredOrders = React.useMemo(() => {
        const isFiltering = search || dateRange || activeFilters.length > 0;
        let baseItems: WorkOrder[];

        if (isFiltering) {
            // If any filter is active, search through all work orders
            baseItems = workOrders;
        } else {
            // Otherwise, show items based on the active tab (only closed ones)
            if (activeTab === 'actividades') {
                baseItems = workOrders.filter(o => normalizeString(o.status) === 'cerrada' && o.isActivity);
            } else if (activeTab === 'todos') {
                baseItems = workOrders.filter(o => normalizeString(o.status) === 'cerrada' && !o.isActivity);
            } else {
                baseItems = workOrders.filter(o => normalizeString(o.status) === 'cerrada' && !o.isActivity && o.ot_number.startsWith(activeTab));
            }
        }

        // Apply simple search
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

        // Apply advanced filters
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
                            return order.facturado === true || (netPrice > 0 && totalInvoiced >= netPrice);
                        }
                         if (status === 'not_invoiced') {
                             return !order.facturado && totalInvoiced < netPrice;
                        }
                        return true;
                    });
                    break;
            }
        });

        return ordersToFilter;

    }, [workOrders, activeTab, search, dateRange, activeFilters]);


    const categories = [
        { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
        ...otCategories
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
        const historicalWorkOrders = workOrders.filter(o => normalizeString(o.status) === 'cerrada' && !o.isActivity);
        return historicalWorkOrders.reduce((acc, order) => {
            const netPrice = order.netPrice || 0;
            const invoicedAmount = (order.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
            
            const isFullyInvoiced = order.facturado === true || (netPrice > 0 && invoicedAmount >= netPrice);

            if (isFullyInvoiced) {
                acc.totalFacturado += netPrice;
            } else {
                acc.totalFacturado += invoicedAmount;
                const pendingAmount = netPrice - invoicedAmount;
                if (pendingAmount > 0) {
                    acc.totalPorFacturar += pendingAmount;
                }
            }
            
            return acc;
        }, { totalPorFacturar: 0, totalFacturado: 0 });
    }, [workOrders]);

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
                            <HistoricalOrdersTable orders={filteredOrders} />
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
