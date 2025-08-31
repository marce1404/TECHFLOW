
'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import DateTime from './date-time';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { ThemeToggle } from './theme-toggle';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from './sidebar';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AppHeader() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Sesión Cerrada',
        description: 'Has cerrado sesión exitosamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
      });
    }
  };
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname.startsWith('/orders/history')) return 'Historial de Órdenes';
    if (pathname.startsWith('/orders/new')) return 'Nueva Orden de Trabajo';
    if (pathname.startsWith('/orders/')) return 'Detalle Orden de Trabajo';
    if (pathname.startsWith('/orders')) return 'Órdenes de Trabajo Activas';
    if (pathname === '/') return 'Órdenes de Trabajo Activas';
    if (pathname.startsWith('/gantt')) return 'Cartas Gantt';
    if (pathname.startsWith('/reports/history')) return 'Historial de Informes';
    if (pathname.startsWith('/reports')) return 'Llenar Informe';
    if (pathname.startsWith('/collaborators')) return 'Colaboradores';
    if (pathname.startsWith('/vehicles')) return 'Vehículos';
    if (pathname.startsWith('/ai-tools')) return 'Asistente IA';
    if (pathname.startsWith('/settings')) return 'Configuración';
    return 'Órdenes de Trabajo';
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-headline font-semibold tracking-tight">
            {getPageTitle()}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <DateTime />
        <ThemeToggle />
      </div>
    </header>
  );
}
