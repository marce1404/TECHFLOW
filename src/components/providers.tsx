
'use client';
import { AuthProvider, useAuth } from "@/context/auth-context";
import { WorkOrdersProvider } from "@/context/work-orders-context";

// A wrapper component that only renders its children if a user is authenticated.
function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    if (!user) {
        // You can return null, a loading spinner, or a login component here.
        // The main AuthProvider already handles the login page redirect, so null is fine.
        return null;
    }

    return <>{children}</>;
}


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <WorkOrdersProvider>
                {children}
            </WorkOrdersProvider>
        </AuthProvider>
    )
}
