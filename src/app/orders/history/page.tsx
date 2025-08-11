
'use client';
import HistoricalOrdersTable from "@/components/orders/historical-orders-table";
import { useWorkOrders } from "@/context/work-orders-context";

export default function HistoryPage() {
    const { historicalWorkOrders } = useWorkOrders();

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-headline font-bold tracking-tight">
                Historial de Órdenes de Trabajo
            </h1>
            <HistoricalOrdersTable orders={historicalWorkOrders} />
        </div>
    );
}
