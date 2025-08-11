

'use client';
import { Button } from "@/components/ui/button";
import { PlusCircle, FileUp } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useWorkOrders } from "@/context/work-orders-context";

export default function ActiveOrdersPage() {
    const { activeWorkOrders, otCategories } = useWorkOrders();

    const filterOrders = (categoryPrefix: string | null) => {
        if (!categoryPrefix) return activeWorkOrders;
        return activeWorkOrders.filter(order => order.ot_number.startsWith(categoryPrefix));
    }

    const categories = [
        { value: "todos", label: "Todos", prefix: null },
        ...otCategories
            .filter(cat => cat.status === 'Activa')
            .map(cat => ({
                value: cat.name.toLowerCase(),
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
            <Tabs defaultValue="todos">
              <TabsList>
                {categories.map(cat => (
                    <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
              {categories.map(cat => (
                <TabsContent key={cat.value} value={cat.value} className="mt-4">
                    <OrdersTable orders={filterOrders(cat.prefix)} />
                </TabsContent>
              ))}
            </Tabs>
        </div>
    );
}
