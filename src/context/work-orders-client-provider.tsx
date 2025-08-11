'use client';
import { activeWorkOrders, historicalWorkOrders, technicians, vehicles } from "@/lib/placeholder-data";
import { WorkOrdersProvider } from "./work-orders-context";

export function WorkOrdersClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <WorkOrdersProvider 
            active={activeWorkOrders} 
            historical={historicalWorkOrders}
            technicians={technicians}
            vehicles={vehicles}
        >
            {children}
        </WorkOrdersProvider>
    )
}
