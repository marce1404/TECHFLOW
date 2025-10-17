
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
    const [activeTab, setActiveTab] = React.useState('ot');
    const [search, setSearch] = React.useState('');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);

    const [isFilterOpen, setIsFilterOpen] = React.useState(false);

    const isAdvancedFiltering = dateRange || activeFilters.length > 0;

    const filteredOrders = React.useMemo(() => {
        let baseItems: WorkOrder[];
        const closedOrders = workOrders.filter(o => normalizeString(o.status) === 'cerrada');

        if (activeTab === 'actividades') {
            baseItems = closedOrders.filter(o => o.isActivity);
        } else if (activeTab === 'todos') {
            baseItems = closedOrders.filter(o => !o.isActivity);
        } else {
            baseItems = closedOrders.filter(o => !o.isActivity && o.ot_number.startsWith(activeTab.toUpperCase()));
        }

        let ordersToFilter = [...baseItems];

        // Apply simple search
        if (search) {
             ordersToFilter = ordersToFilter.filter(order =>
                order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
                (order.description && order.description.toLowerCase().includes(search.toLowerCase())) ||
                (order.client && order.client.toLowerCase().includes(search.toLowerCase()))
            );
        }

        // Apply date range filter for overlap
        if (dateRange?.from) {
            const filterTo = dateRange.to || dateRange.from; // Use 'to' or same as 'from' if 'to' is not set
            ordersToFilter = ordersToFilter.filter(order => {
                const orderCloseDate = order.endDate ? new Date(order.endDate.replace(/-/g, '/')) : null;
                if (!orderCloseDate) return false;
                
                const filterStart = dateRange.from!;
                
                return orderCloseDate >= filterStart && orderCloseDate <= filterTo;
            });
        }


        // Apply advanced filters
        activeFilters.forEach(filter => {
            switch (filter.type) {
                case 'clients':
                    ordersToFilter = ordersToFilter.filter(order => order.client ? filter.values.includes(order.client) : false);
                    break;
                case 'services':
                    ordersToFilter = ordersToFilter.filter(order => order.service ? filter.values.includes(order.service) : false);
                    break;
                case 'technicians':
                     ordersToFilter = ordersToFilter.filter(order => (order.technicians || []).some(t => filter.values.includes(t)));
                    break;
                case 'supervisors':
                     ordersToFilter = ordersToFilter.filter(order => (order.assigned || []).some(s => filter.values.includes(s)));
                    break;
                 case 'comercial':
                    ordersToFilter = ordersToFilter.filter(order => order.comercial ? filter.values.includes(order.comercial) : false);
                    break;
                case 'priorities':
                    ordersToFilter = ordersToFilter.filter(order => order.priority ? filter.values.includes(order.priority) : false);
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

        // Default sort by creation date (descending)
        return ordersToFilter.sort((a, b) => {
            const dateA = a.endDate ? new Date(a.endDate.replace(/-/g, '/')).getTime() : 0;
            const dateB = b.endDate ? new Date(b.endDate.replace(/-/g, '/')).getTime() : 0;
            return dateB - dateA;
        });

    }, [workOrders, activeTab, search, dateRange, activeFilters]);


    const categories = [
        ...otCategories
            .map(cat => ({
                id: cat.id,
                value: cat.prefix.toLowerCase(),
                label: `${cat.name} (${cat.prefix})`,
                prefix: cat.prefix,
            })),
        { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
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
        return filteredOrders.filter(item => !item.isActivity).reduce((acc, order) => {
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
    }, [filteredOrders]);

    return (
        <div className="flex flex-col gap-4">
            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="space-y-2">
                 <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <ChevronsUpDown className="h-4 w-4 mr-2" />
                             {isAdvancedFiltering ? `Filtros Avanzados (${activeFilters.length + (dateRange ? 1 : 0)})` : 'Filtros Avanzados'}
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                    <Card>
                        <CardHeader>
                            <CardTitle>Filtros Avanzados</CardTitle>
                             <CardDescription>
                                Los filtros de fecha aquí aplican sobre la fecha de cierre de la OT.
                            </CardDescription>
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
                                            <TabsTrigger key={cat.id} value={cat.value}>{cat.label}</TabsTrigger>
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
                            <CardTitle className="text-lg mb-4">{`Resultados de Búsqueda (${filteredOrders.length})`}</CardTitle>
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
