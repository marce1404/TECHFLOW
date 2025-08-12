'use client';
import { AuthProvider } from "@/context/auth-context";
import { WorkOrdersClientProvider } from "@/context/work-orders-client-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <WorkOrdersClientProvider>
                {children}
            </WorkOrdersClientProvider>
        </AuthProvider>
    )
}
