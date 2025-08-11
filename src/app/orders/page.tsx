
'use client';
import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { activeWorkOrders } from "@/lib/placeholder-data";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { WorkOrder } from "@/lib/types";

export default function ActiveOrdersPage() {
    const searchParams = useSearchParams();
    const updatedOrderString = searchParams.get('updatedOrder');
    
    const ordersWithUpdates = useMemo(() => {
        if (updatedOrderString) {
            try {
                const updatedOrder: WorkOrder = JSON.parse(decodeURIComponent(updatedOrderString));
                // Create a new array with the updated order
                const newOrders = activeWorkOrders.map(order => 
                    order.id === updatedOrder.id ? updatedOrder : order
                );
                return newOrders;
            } catch (error) {
                console.error("Failed to parse updated order:", error);
                return activeWorkOrders;
            }
        }
        return activeWorkOrders;
    }, [updatedOrderString]);


    const filterOrders = (category: string) => {
        if (!category.includes('(')) return ordersWithUpdates;
        const parts = category.split('(');
        if (parts.length < 2) return ordersWithUpdates;
        const prefix = parts[1].split(')')[0];
        return ordersWithUpdates.filter(order => order.ot_number.startsWith(prefix));
    }

    const categories = [
        { value: "todos", label: "Todos" },
        { value: "servicios", label: "Servicios (OS)" },
        { value: "proyectos", label: "Proyectos (OT)" },
        { value: "mantenciones", label: "Mantenciones (OM)" },
        { value: "otros", label: "Otros (OTR)" },
    ]

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
            <Tabs defaultValue="todos">
              <TabsList>
                {categories.map(cat => (
                    <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
              {categories.map(cat => (
                <TabsContent key={cat.value} value={cat.value}>
                    <OrdersTable orders={filterOrders(cat.label)} />
                </TabsContent>
              ))}
            </Tabs>
        </div>
    );
}
