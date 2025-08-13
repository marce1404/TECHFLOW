'use client';

import AppLayout from '@/components/layout/app-layout';

export default function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
        <AppLayout>
            <div className="flex-1 pb-8">
             {children}
            </div>
        </AppLayout>
    </div>
  );
}
