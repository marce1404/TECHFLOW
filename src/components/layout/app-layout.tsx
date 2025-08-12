
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { useAuth } from '@/context/auth-context';
import LoginPage from '@/app/login/page';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const isPrintView = pathname.includes('/print');

    if (!user) {
        return <LoginPage />;
    }
    
    if (isPrintView) {
        return <main>{children}</main>;
    }
    
    return (
        <SidebarProvider>
            <div className={cn('no-print')}>
                <Sidebar>
                    <AppSidebar />
                </Sidebar>
                <SidebarInset>
                    <AppHeader />
                    <main className="p-4 sm:p-6 lg:p-8">{children}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
