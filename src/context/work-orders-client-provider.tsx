
'use client';
import { WorkOrdersProvider } from "./work-orders-context";

export function WorkOrdersClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <WorkOrdersProvider>
            {children}
        </WorkOrdersProvider>
    )
}
