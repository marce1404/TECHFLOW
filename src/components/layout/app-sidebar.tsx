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
  BarChart2
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';


export default function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

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
      href: '/technicians',
      label: 'Técnicos',
      icon: Users,
    },
    {
      href: '/vehicles',
      label: 'Vehículos',
      icon: Truck,
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  };
  
  if (state === 'collapsed') {
    return (
        <>
            <SidebarHeader/>
            <SidebarContent>
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            tooltip={item.label}
                            variant={isActive(item.href) ? 'default' : 'ghost'}
                            className={isActive(item.href) ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}
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
                    <SidebarMenuButton asChild tooltip="Configuración" variant="ghost">
                    <Link href="#">
                        <Settings />
                    </Link>
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
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                    <path d="m19 12-7 7-7-7" />
                </svg>
            </div>
            <span className="font-headline text-lg font-semibold text-sidebar-foreground">
              APTECH
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
            <SidebarMenuButton asChild tooltip="Configuración">
              <Link href="#">
                <Settings />
                <span>Configuración</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
