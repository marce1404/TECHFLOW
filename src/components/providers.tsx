
'use client';
import { AuthProvider } from "@/context/auth-context";
import { WorkOrdersProvider } from "@/context/work-orders-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <WorkOrdersProvider>
                {children}
            </WorkOrdersProvider>
        </AuthProvider>
    )
}
