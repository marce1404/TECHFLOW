
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/app-layout';
import { WorkOrdersProvider } from '@/context/work-orders-context';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

// This component ensures that the WorkOrdersProvider and its children
// are only rendered after the authentication state has been confirmed.
function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    // While the auth state is loading, we can show a loader or nothing.
    // This prevents any child components from making unauthorized Firestore calls.
    if (loading || !user) {
        return (
            <div className="flex flex-col h-screen">
                <div className="flex items-center justify-between p-4 border-b">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div className="flex flex-1">
                    <div className="w-64 p-4 border-r hidden md:block">
                        <div className="space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-8">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    // Once the user is confirmed, render the data provider and the app content.
    return (
        <WorkOrdersProvider>
            <AppLayout>
                {children}
            </AppLayout>
        </WorkOrdersProvider>
    );
}


export default function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <ProtectedContent>
        {children}
    </ProtectedContent>
  );
}
