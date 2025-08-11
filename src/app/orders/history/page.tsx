
'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HistoryPage() {
    const { historicalWorkOrders } = useWorkOrders();

    const filterOrders = (category: string) => {
        if (!category.includes('(')) return historicalWorkOrders;
        const parts = category.split('(');
        if (parts.length < 2) return historicalWorkOrders;
        const prefix = parts[1].split(')')[0];
        return historicalWorkOrders.filter(order => order.ot_number.startsWith(prefix));
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
                <TabsContent key={cat.value} value={cat.value}>
                    <HistoricalOrdersTable orders={filterOrders(cat.label)} />
                </TabsContent>
              ))}
            </Tabs>
        </div>
    );
}
