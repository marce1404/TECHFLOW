
'use client';
import { AuthProvider } from "./auth-context";
import { WorkOrdersProvider } from "./work-orders-context";

export function WorkOrdersClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <WorkOrdersProvider>
                {children}
            </WorkOrdersProvider>
        </AuthProvider>
    )
}
