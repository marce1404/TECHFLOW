
'use client';
import { AuthProvider, useAuth } from "@/context/auth-context";
import { WorkOrdersProvider } from "@/context/work-orders-context";

// A wrapper component that only renders its children if a user is authenticated.
function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    // While authentication is in progress, we can show a loader or nothing.
    // The main AuthProvider loader will likely be visible anyway.
    if (loading || !user) {
        return null;
    }

    // Only render the children (which require authentication) once the user is confirmed.
    return <WorkOrdersProvider>{children}</WorkOrdersProvider>;
}


export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ProtectedContent>
                {children}
            </ProtectedContent>
        </AuthProvider>
    )
}
