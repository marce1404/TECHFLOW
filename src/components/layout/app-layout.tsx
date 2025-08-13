
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { useAuth } from '@/context/auth-context';
import LoginPage from '@/app/login/page';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const isPrintView = pathname.includes('/print');
    const isDashboard = pathname === '/';

    if (!user) {
        return <LoginPage />;
    }
    
    // For print views, we render only the children without any layout.
    if (isPrintView) {
        return <main>{children}</main>;
    }
    
    if (isDashboard) {
      return (
         <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      )
    }
    
    return (
        <SidebarProvider>
            <div className="md:flex">
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
