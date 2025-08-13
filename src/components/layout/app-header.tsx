'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import DateTime from './date-time';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-headline font-semibold tracking-tight">
            OT ACTIVAS
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <DateTime />
      </div>
    </header>
  );
}
