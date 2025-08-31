'use client';

import AppLayout from '@/components/layout/app-layout';
import { usePathname } from 'next/navigation';

export default function AppProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
        <AppLayout>
            <div className={`flex-1 ${isDashboard ? '' : 'pb-8'}`}>
             {children}
            </div>
        </AppLayout>
    </div>
  );
}
