

'use client';
import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";
import * as React from "react";
import type { WorkOrder } from "@/lib/types";

export default function ActiveOrdersPage() {
    const { activeWorkOrders, otCategories } = useWorkOrders();
    const [filteredOrders, setFilteredOrders] = React.useState<WorkOrder[]>(activeWorkOrders);

    const filterOrders = (categoryPrefix: string | null) => {
        if (!categoryPrefix || categoryPrefix === 'todos') {
            setFilteredOrders(activeWorkOrders);
            return;
        };
        setFilteredOrders(activeWorkOrders.filter(order => order.ot_number.startsWith(categoryPrefix)));
    }
    
    React.useEffect(() => {
        setFilteredOrders(activeWorkOrders);
    }, [activeWorkOrders]);

    const categories = [
        { value: "todos", label: "Todos", prefix: 'todos' },
        ...otCategories
            .filter(cat => cat.status === 'Activa')
            .map(cat => ({
                value: cat.prefix,
                label: `${cat.name} (${cat.prefix})`,
                prefix: cat.prefix,
            }))
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Órdenes de Trabajo
                </h1>
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
            <Tabs defaultValue="todos" onValueChange={filterOrders}>
              <TabsList>
                {categories.map(cat => (
                    <TabsTrigger key={cat.value} value={cat.prefix}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="todos">
                  <OrdersTable orders={filteredOrders} />
              </TabsContent>
              {categories.filter(c => c.value !== 'todos').map(cat => (
                <TabsContent key={cat.value} value={cat.prefix}>
                    <OrdersTable orders={filteredOrders} />
                </TabsContent>
              ))}
            </Tabs>
        </div>
    );
}
