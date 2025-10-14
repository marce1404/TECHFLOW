
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
    const [activeTab, setActiveTab] = React.useState('todos'); // Default to 'todos'
    const [isFilterOpen, setIsFilterOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>([]);
    
    const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';
    
    const isFiltering = search || dateRange || activeFilters.length > 0;

    const filteredOrders = React.useMemo(() => {
        let baseItems: WorkOrder[];

        if (isFiltering) {
            // If any filter is active, search through all work orders
            baseItems = workOrders.filter(o => normalizeString(o.status) !== 'cerrada');
        } else {
            // Otherwise, show items based on the active tab (only active ones)
            if (activeTab === 'actividades') {
                baseItems = workOrders.filter(item => item.isActivity && normalizeString(item.status) !== 'cerrada');
            } else if (activeTab === 'todos') {
                baseItems = workOrders.filter(item => !item.isActivity && normalizeString(item.status) !== 'cerrada');
            } else {
                baseItems = workOrders.filter(order => order.ot_number.startsWith(activeTab.toUpperCase()) && normalizeString(order.status) !== 'cerrada');
            }
        }
        
        let ordersToFilter = baseItems;

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
                if (!order.date) return false;
                const orderStart = new Date(order.date.replace(/-/g, '/'));
                const orderEnd = order.endDate ? new Date(order.endDate.replace(/-/g, '/')) : orderStart;
                
                const filterStart = dateRange.from!;
                
                // Check for interval overlap: (StartA <= EndB) and (StartB <= EndA)
                return orderStart <= filterTo && filterStart <= orderEnd;
            });
        }

        // Apply advanced filters from activeFilters state
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
        
        // Default sort by creation date (descending)
        return ordersToFilter.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt.replace(/-/g, '/')).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt.replace(/-/g, '/')).getTime() : 0;
            return dateB - dateA;
        });

    }, [workOrders, activeTab, search, dateRange, activeFilters, isFiltering]);

    const categories = [
        { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
        ...otCategories
            .filter(cat => cat.status === 'Activa')
            .map(cat => ({
                id: cat.id,
                value: cat.prefix.toLowerCase(),
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
        const itemsToCalculate = filteredOrders;
        
        return itemsToCalculate.filter(item => !item.isActivity).reduce((acc, order) => {
            const invoicedAmount = (order.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
            const netPrice = order.netPrice || 0;
            const pendingAmount = netPrice - invoicedAmount;

            if (pendingAmount > 0) {
                acc.totalPorFacturar += pendingAmount;
            }
            
            acc.totalFacturado += invoicedAmount;

            return acc;
        }, { totalPorFacturar: 0, totalFacturado: 0 });
    }, [filteredOrders]);


    return (
        <div className="flex flex-col gap-4">
             <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="space-y-2">
                <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                            <ChevronsUpDown className="mr-2 h-4 w-4" />
                            {isFiltering ? `Filtros Avanzados (${activeFilters.length + (dateRange ? 1 : 0) + (search ? 1 : 0)})` : 'Filtros Avanzados'}
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
                             <CardTitle className="text-lg mb-4">{isFiltering ? `Resultados de Búsqueda (${filteredOrders.length})` : `OTs Activas (${filteredOrders.length})`}</CardTitle>
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
