

'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  File,
  History,
  Users,
  Truck,
  Settings,
  BarChart2,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
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

  const menuItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      href: '/orders',
      label: 'OTs Activas',
      icon: File,
    },
     {
      href: '/orders/history',
      label: 'Historial',
      icon: History,
    },
    {
      href: '/gantt',
      label: 'Cartas Gantt',
      icon: BarChart2,
    },
    {
      href: '/collaborators',
      label: 'Colaboradores',
      icon: Users,
    },
    {
      href: '/vehicles',
      label: 'Vehículos',
      icon: Truck,
    },
     {
      href: '/ai-tools/resource-assignment',
      label: 'Asistente IA',
      icon: Sparkles,
    }
  ];

  const settingsMenuItem = {
    href: '/settings',
    label: 'Configuración',
    icon: Settings,
  };


  const isActive = (href: string) => {
    // For the root path, we need an exact match.
    if (href === '/') {
        return pathname === '/';
    }
    // For other paths, use startsWith to handle nested routes correctly
    return pathname.startsWith(href) && href !== '/';
  };
  
  if (state === 'collapsed') {
    return (
        <>
            <SidebarHeader>
                <div className="flex items-center justify-center p-2">
                    <SidebarMenuButton
                        asChild
                        isActive={pathname === '/'}
                        tooltip="Dashboard"
                        variant={pathname === '/' ? 'default' : 'ghost'}
                        className="h-10 w-10"
                    >
                        <Link href="/">
                            <LayoutGrid />
                        </Link>
                    </SidebarMenuButton>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.slice(1).map((item) => (
                        <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            tooltip={item.label}
                            variant={isActive(item.href) ? 'default' : 'ghost'}
                            className="h-10 w-10"
                        >
                            <Link href={item.href}>
                                <item.icon />
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton 
                        asChild 
                        tooltip="Configuración" 
                        variant={isActive(settingsMenuItem.href) ? 'default' : 'ghost'}
                        className="h-10 w-10"
                        isActive={isActive(settingsMenuItem.href)}
                    >
                    <Link href={settingsMenuItem.href}>
                        <Settings />
                    </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton 
                        onClick={handleLogout}
                        tooltip="Cerrar Sesión"
                        variant='ghost'
                        className="h-10 w-10"
                    >
                        <LogOut />
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </>
    )
  }


  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
            <div className="bg-primary p-2 rounded-lg">
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary-foreground"
                >
                    <path d="M12 2 L12 22" />
                    <path d="M12 2 L6 8" />
                    <path d="M12 2 L18 8" />
                    <path d="M12 14 L6 20" />
                    <path d="M12 14 L18 20" />
                </svg>
            </div>
            <span className="font-headline text-lg font-semibold text-sidebar-foreground">
              TechFlow
            </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) =>
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  tooltip={item.label}
                  variant={isActive(item.href) ? 'default' : 'ghost'}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
                asChild 
                tooltip="Configuración"
                isActive={isActive(settingsMenuItem.href)}
                variant={isActive(settingsMenuItem.href) ? 'default' : 'ghost'}
            >
              <Link href={settingsMenuItem.href}>
                <Settings />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton 
                onClick={handleLogout}
                tooltip="Cerrar Sesión"
                variant='ghost'
            >
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
