'use client';
import { activeWorkOrders, historicalWorkOrders, technicians } from "@/lib/placeholder-data";
import { WorkOrdersProvider } from "./work-orders-context";

export function WorkOrdersClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <WorkOrdersProvider 
            active={activeWorkOrders} 
            historical={historicalWorkOrders}
            technicians={technicians}
        >
            {children}
        </WorkOrdersProvider>
    )
}
