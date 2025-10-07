
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { WorkOrdersProvider } from '@/context/work-orders-context';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

function ProtectedRoutes({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  React.useEffect(() => {
      if (!loading && !user) {
          router.replace('/login');
      }
  }, [user, loading, router]);


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
                        {[...Array(7)].map((_, i) => (
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

  return <AppLayout>{children}</AppLayout>;
}


export default function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
      <WorkOrdersProvider>
        <ProtectedRoutes>
            {children}
        </ProtectedRoutes>
      </WorkOrdersProvider>
  );
}
