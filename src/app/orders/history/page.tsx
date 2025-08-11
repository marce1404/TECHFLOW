

'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HistoryPage() {
    const { historicalWorkOrders, otCategories } = useWorkOrders();

    const filterOrders = (categoryPrefix: string | null) => {
        if (!categoryPrefix) return historicalWorkOrders;
        return historicalWorkOrders.filter(order => order.ot_number.startsWith(categoryPrefix));
    }

    const categories = [
        { value: "todos", label: "Todos", prefix: null },
        ...otCategories
            .map(cat => ({
                value: cat.name.toLowerCase(),
                label: `${cat.name} (${cat.prefix})`,
                prefix: cat.prefix,
            }))
    ];

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-headline font-bold tracking-tight">
                Historial de Órdenes de Trabajo
            </h1>
            <Tabs defaultValue="todos">
              <TabsList>
                {categories.map(cat => (
                    <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
                ))}
              </TabsList>
              {categories.map(cat => (
                <TabsContent key={cat.value} value={cat.value} className="mt-4">
                    <HistoricalOrdersTable orders={filterOrders(cat.prefix)} />
                </TabsContent>
              ))}
            </Tabs>
        </div>
    );
}
