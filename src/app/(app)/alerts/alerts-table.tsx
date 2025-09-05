
'use client';
import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export type ExpirationAlertItem = {
    collaboratorId: string;
    collaboratorName: string;
    itemName: string;
    daysUntilExpiration: number;
    expirationDate: string;
};

interface AlertsTableProps {
    items: ExpirationAlertItem[];
    search: string;
    onSearchChange: (value: string) => void;
    sortConfig: { key: keyof ExpirationAlertItem | null; direction: 'ascending' | 'descending' };
    onSort: (key: keyof ExpirationAlertItem) => void;
}

export default function AlertsTable({ items, search, onSearchChange, sortConfig, onSort }: AlertsTableProps) {
    const getStatusColor = (days: number) => {
        if (days < 0) return 'text-destructive font-bold';
        if (days <= 7) return 'text-destructive';
        if (days <= 30) return 'text-yellow-600';
        return 'text-muted-foreground';
    };

    const getStatusText = (days: number) => {
        if (days < 0) return `Vencido hace ${Math.abs(days)} día(s)`;
        if (days === 0) return 'Vence Hoy';
        return `Vence en ${days} día(s)`;
    };
    
    const headers: { key: keyof ExpirationAlertItem, label: string, className?: string }[] = [
        { key: 'collaboratorName', label: 'Colaborador', className: 'w-[25%]' },
        { key: 'itemName', label: 'Ítem / Documento', className: 'w-[35%]' },
        { key: 'expirationDate', label: 'Fecha de Vencimiento', className: 'w-[20%]' },
        { key: 'daysUntilExpiration', label: 'Estado', className: 'w-[20%]' },
    ];


    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Input
                    placeholder="Buscar por colaborador o ítem..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.map(header => (
                                <TableHead key={header.key} className={header.className}>
                                    <Button variant="ghost" onClick={() => onSort(header.key)}>
                                        {header.label}
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <TableRow key={`${item.collaboratorId}-${item.itemName}-${index}`}>
                                    <TableCell>
                                        <Link href={`/collaborators/${item.collaboratorId}/edit`} className="text-primary hover:underline">
                                            {item.collaboratorName}
                                        </Link>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.itemName}</TableCell>
                                    <TableCell>{format(parseISO(item.expirationDate), 'dd/MM/yyyy', {locale: es})}</TableCell>
                                    <TableCell className={getStatusColor(item.daysUntilExpiration)}>
                                        {getStatusText(item.daysUntilExpiration)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={headers.length} className="h-24 text-center">
                                    No hay alertas de vencimiento para mostrar.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

