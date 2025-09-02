
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/app-layout';
import { WorkOrdersProvider } from '@/context/work-orders-context';
import { AuthProvider } from '@/context/auth-context';

export default function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <AuthProvider>
        <WorkOrdersProvider>
            <AppLayout>
                {children}
            </AppLayout>
        </WorkOrdersProvider>
    </AuthProvider>
  );
}
