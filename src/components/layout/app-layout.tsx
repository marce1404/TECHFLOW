
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { useAuth } from '@/context/auth-context';
import LoginPage from '@/app/login/page';
import { usePathname } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const isPrintView = pathname.includes('/print');
    const isDashboard = pathname === '/dashboard';

    if (loading) {
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
    
    if (!user) {
        return <LoginPage />;
    }
    
    // For print views, we render only the children without any layout.
    if (isPrintView) {
        return <main>{children}</main>;
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <AppSidebar />
            </Sidebar>
            <SidebarInset>
                <AppHeader />
                <main className={isDashboard ? '' : 'p-4 sm:p-6 lg:p-8'}>{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
