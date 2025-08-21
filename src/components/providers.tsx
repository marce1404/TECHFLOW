
'use client';
import { WorkOrdersClientProvider } from "@/context/work-orders-client-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WorkOrdersClientProvider>
            {children}
        </WorkOrdersClientProvider>
    )
}
