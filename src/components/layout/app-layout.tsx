
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import { useAuth } from '@/context/auth-context';
import LoginPage from '@/app/login/page';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    if (!user) {
        return <LoginPage />;
    }

    return (
        <SidebarProvider>
            <Sidebar collapsible='icon'>
                <AppSidebar />
            </Sidebar>
            <SidebarInset>
                <main className="p-4 sm:p-6 lg:p-8">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
