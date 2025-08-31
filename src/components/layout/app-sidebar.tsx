

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
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
  ClipboardCheck,
  FilePlus2,
  Archive,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import { useAuth } from '@/context/auth-context';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';

export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { toast } = useToast();
  const { companyInfo } = useWorkOrders();
  const { userProfile } = useAuth();


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
      exact: true,
    },
    {
      href: '/orders',
      label: 'OTs Activas',
      icon: File,
      exact: true, // Treat as exact to avoid highlighting for sub-routes
      subItems: [
        { href: '/orders/history', label: 'Historial', icon: History }
      ]
    },
    {
      href: '/gantt',
      label: 'Cartas Gantt',
      icon: BarChart2,
      exact: true,
    },
    {
      href: '/reports',
      label: 'Llenar Informe',
      icon: FilePlus2,
      exact: false, // To catch /reports and /reports/new
    },
    {
      href: '/reports/history',
      label: 'Historial Informes',
      icon: Archive,
      exact: true,
    },
    {
      href: '/collaborators',
      label: 'Colaboradores',
      icon: Users,
      exact: true,
    },
    {
      href: '/vehicles',
      label: 'Vehículos',
      icon: Truck,
      exact: true,
    },
     {
      href: '/ai-tools/resource-assignment',
      label: 'Asistente IA',
      icon: Sparkles,
      exact: true,
    }
  ];

  const settingsMenuItem = {
    href: '/settings',
    label: 'Configuración',
    icon: Settings,
    exact: true
  };


  const isActive = (href: string, isExact: boolean = true) => {
    if (isExact) {
        return pathname === href;
    }
    // For non-exact matches
    if (href === '/reports') {
        return pathname.startsWith('/reports') && !pathname.startsWith('/reports/history');
    }
    if (href === '/orders') {
        return pathname.startsWith('/orders');
    }
    return pathname.startsWith(href);
  };
  
    const getInitials = (name?: string) => {
        if (!name) return 'U';
        const names = name.split(' ');
        const initials = names.map(n => n[0]).join('');
        return initials.slice(0, 2).toUpperCase();
    };

  if (state === 'collapsed') {
    return (
        <>
            <SidebarHeader>
                <div className="flex items-center justify-center p-2">
                    <SidebarMenuButton
                        asChild
                        isActive={isActive(menuItems[0].href, menuItems[0].exact)}
                        tooltip="Dashboard"
                        variant={isActive(menuItems[0].href, menuItems[0].exact) ? 'default' : 'ghost'}
                        className="h-10 w-10"
                    >
                        <Link href="/">
                            <LayoutGrid className="h-5 w-5" />
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
                            isActive={isActive(item.href, item.exact)}
                            tooltip={item.label}
                            variant={isActive(item.href, item.exact) ? 'default' : 'ghost'}
                            className="h-10 w-10"
                        >
                            <Link href={item.href}>
                                <item.icon className="h-5 w-5" />
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
                        variant={isActive(settingsMenuItem.href, settingsMenuItem.exact) ? 'default' : 'ghost'}
                        className="h-10 w-10"
                        isActive={isActive(settingsMenuItem.href, settingsMenuItem.exact)}
                    >
                    <Link href={settingsMenuItem.href}>
                        <Settings className="h-5 w-5" />
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
                        <LogOut className="h-5 w-5" />
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
              {companyInfo?.name || 'TechFlow'}
            </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) =>
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href, item.exact)}
                  variant={isActive(item.href, item.exact) ? 'default' : 'ghost'}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                 {item.subItems && isActive('/orders', false) && (
                    <SidebarMenuSub>
                        {item.subItems.map(subItem => (
                            <SidebarMenuSubItem key={subItem.href}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                    <Link href={subItem.href}>
                                        <subItem.icon className="h-5 w-5" />
                                        <span>{subItem.label}</span>
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                )}
              </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
                asChild 
                isActive={isActive(settingsMenuItem.href, settingsMenuItem.exact)}
                variant={isActive(settingsMenuItem.href, settingsMenuItem.exact) ? 'default' : 'ghost'}
            >
              <Link href={settingsMenuItem.href}>
                <Settings className="h-5 w-5" />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className="my-1 bg-sidebar-border" />
          <div className="flex items-center gap-3 p-2">
            <Avatar className="h-9 w-9">
                <AvatarFallback>{getInitials(userProfile?.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-sm leading-tight truncate">{userProfile?.displayName}</span>
                <span className="text-xs text-muted-foreground leading-tight">{userProfile?.role}</span>
            </div>
            <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Cerrar Sesión"
                variant='ghost'
                className="h-9 w-9 p-2 shrink-0"
            >
                <LogOut className="h-5 w-5" />
            </SidebarMenuButton>
          </div>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
