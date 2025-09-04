
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
import { Badge } from '@/components/ui/badge';
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
}

export default function AlertsTable({ items }: AlertsTableProps) {
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof ExpirationAlertItem | null; direction: 'ascending' | 'descending' }>({ key: 'daysUntilExpiration', direction: 'ascending' });
    const [search, setSearch] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 15;

    const requestSort = (key: keyof ExpirationAlertItem) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };
    
    const filteredItems = React.useMemo(() => {
        return items.filter(item => 
            item.collaboratorName.toLowerCase().includes(search.toLowerCase()) ||
            item.itemName.toLowerCase().includes(search.toLowerCase())
        );
    }, [items, search]);

    const sortedItems = React.useMemo(() => {
        let sortableItems = [...filteredItems];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue! < bValue!) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue! > bValue!) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredItems, sortConfig]);
    
    const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
    const paginatedItems = sortedItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

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
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.map(header => (
                                <TableHead key={header.key} className={header.className}>
                                    <Button variant="ghost" onClick={() => requestSort(header.key)}>
                                        {header.label}
                                        <ArrowUpDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.length > 0 ? (
                            paginatedItems.map((item, index) => (
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
             <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Mostrando {paginatedItems.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, sortedItems.length)} de {sortedItems.length} alertas.
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</Button>
                    <span>Página {currentPage} de {totalPages > 0 ? totalPages : 1}</span>
                    <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
                </div>
            </div>
        </div>
    );
}

