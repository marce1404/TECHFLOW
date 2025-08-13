

'use client';
import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function ActiveOrdersPage() {
    const { activeWorkOrders, otCategories } = useWorkOrders();
    const [search, setSearch] = React.useState('');
    const [activeTab, setActiveTab] = React.useState('todos');

    const filterOrders = (categoryPrefix: string | null) => {
        setActiveTab(categoryPrefix || 'todos');
    };
    
    const filteredOrders = React.useMemo(() => {
        let orders = activeWorkOrders;
        if (activeTab !== 'todos') {
            orders = orders.filter(order => order.ot_number.startsWith(activeTab));
        }
        if (search) {
            orders = orders.filter(order =>
                order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
                order.description.toLowerCase().includes(search.toLowerCase()) ||
                order.client.toLowerCase().includes(search.toLowerCase()) ||
                order.service.toLowerCase().includes(search.toLowerCase())
            );
        }
        return orders;
    }, [activeWorkOrders, activeTab, search]);

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
            <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <FileUp className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </Button>
                    <Button asChild>
                      <Link href="/orders/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nueva OT
                      </Link>
                    </Button>
                </div>
            </div>
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
                     <Input
                        placeholder="Buscar por ID, cliente, servicio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:max-w-sm"
                    />
                </div>
              <TabsContent value={activeTab}>
                  <OrdersTable orders={filteredOrders} />
              </TabsContent>
            </Tabs>
        </div>
    );
}
