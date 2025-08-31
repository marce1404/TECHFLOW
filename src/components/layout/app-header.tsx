
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

export default function AppHeader() {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    if (pathname === '/') return 'OT ACTIVAS';
    if (pathname.startsWith('/orders/history')) return 'Historial de Órdenes';
    if (pathname.startsWith('/orders/new')) return 'Nueva Orden de Trabajo';
    if (pathname.startsWith('/orders/')) return 'Detalle Orden de Trabajo';
    if (pathname.startsWith('/orders')) return 'Órdenes de Trabajo';
    if (pathname.startsWith('/gantt')) return 'Cartas Gantt';
    if (pathname.startsWith('/reports/history')) return 'Historial de Informes';
    if (pathname.startsWith('/reports')) return 'Llenar Informe';
    if (pathname.startsWith('/collaborators')) return 'Colaboradores';
    if (pathname.startsWith('/vehicles')) return 'Vehículos';
    if (pathname.startsWith('/ai-tools')) return 'Asistente IA';
    if (pathname.startsWith('/settings')) return 'Configuración';
    return 'Dashboard';
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
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border p-1 pr-3 hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start min-w-0">
                        <span className="font-semibold text-sm leading-tight truncate max-w-[150px]">{userProfile?.displayName}</span>
                        <span className="text-xs text-muted-foreground leading-tight">{userProfile?.role}</span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Perfil</DropdownMenuItem>
                <DropdownMenuItem disabled>Facturación</DropdownMenuItem>
                <DropdownMenuItem disabled>Configuración</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Cerrar Sesión</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
