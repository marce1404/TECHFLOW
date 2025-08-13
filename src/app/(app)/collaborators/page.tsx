

'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useWorkOrders } from '@/context/work-orders-context';
import CollaboratorsTable from '@/components/collaborators/collaborators-table';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Collaborator } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function CollaboratorsPage() {
    const { collaborators } = useWorkOrders();
    const [search, setSearch] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<Collaborator['role'] | 'Todos'>('Todos');
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof Collaborator | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });

    const requestSort = (key: keyof Collaborator) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedCollaborators = React.useMemo(() => {
        let sortableItems = [...collaborators];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key]! < b[sortConfig.key]!) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key]! > b[sortConfig.key]!) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [collaborators, sortConfig]);

    const filteredCollaborators = sortedCollaborators.filter((collaborator) => {
        const matchesRole = roleFilter === 'Todos' || collaborator.role === roleFilter;
        const matchesSearch = 
            collaborator.name.toLowerCase().includes(search.toLowerCase()) ||
            collaborator.role.toLowerCase().includes(search.toLowerCase()) ||
            collaborator.area.toLowerCase().includes(search.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const collaboratorRoles: (Collaborator['role'] | 'Todos')[] = ['Todos', 'Técnico', 'Supervisor', 'Coordinador', 'Jefe de Proyecto', 'Encargado', 'Vendedor'];

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardContent className="p-4">
                    <Tabs value={roleFilter} onValueChange={(value) => setRoleFilter(value as Collaborator['role'] | 'Todos')}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                            <ScrollArea className="w-full sm:w-auto">
                                <TabsList className="w-max">
                                    {collaboratorRoles.map(role => (
                                        <TabsTrigger key={role} value={role}>{role}</TabsTrigger>
                                    ))}
                                </TabsList>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            <div className="flex w-full sm:w-auto items-center gap-2">
                                <Input
                                    placeholder="Buscar por nombre, cargo..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full sm:max-w-sm"
                                />
                                <Button asChild>
                                    <Link href="/collaborators/new">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Nuevo Colaborador
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        
                        <TabsContent value={roleFilter}>
                            <CollaboratorsTable 
                                collaborators={filteredCollaborators}
                                requestSort={requestSort}
                                sortConfig={sortConfig}
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
