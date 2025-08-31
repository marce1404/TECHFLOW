
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/app-layout';
import { WorkOrdersProvider } from '@/context/work-orders-context';

export default function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  return (
    <WorkOrdersProvider>
        <AppLayout>
            {children}
        </AppLayout>
    </WorkOrdersProvider>
  );
}
