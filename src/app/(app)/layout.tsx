
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/app-layout';
import { WorkOrdersClientProvider } from '@/context/work-orders-client-provider';


export default function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <WorkOrdersClientProvider>
        <AppLayout>
            {children}
        </AppLayout>
    </WorkOrdersClientProvider>
  );
}
