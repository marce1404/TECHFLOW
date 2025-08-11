'use client';
import { activeWorkOrders, historicalWorkOrders } from "@/lib/placeholder-data";
import { WorkOrdersProvider } from "./work-orders-context";

export function WorkOrdersClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <WorkOrdersProvider active={activeWorkOrders} historical={historicalWorkOrders}>
            {children}
        </WorkOrdersProvider>
    )
}
