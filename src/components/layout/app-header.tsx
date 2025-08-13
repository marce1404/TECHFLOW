'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

export default function AppHeader() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const isDashboard = pathname === '/';
  
  const showSidebarTrigger = !isDashboard || isMobile;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        {showSidebarTrigger && <SidebarTrigger />}
      </div>
      <div className="flex items-center gap-4">
        {/* Placeholder for future items like user menu or theme toggle */}
      </div>
    </header>
  );
}
