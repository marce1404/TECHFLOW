import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import OrdersTable from "@/components/orders/orders-table";

export default function ActiveOrdersPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Órdenes de Trabajo Activas
                </h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva OT
                </Button>
            </div>
            <OrdersTable />
        </div>
    );
}
