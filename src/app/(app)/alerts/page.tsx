
'use client';

import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import AlertsTable, { type ExpirationAlertItem } from './alerts-table';
import { differenceInDays, parseISO, addYears } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

const ITEMS_PER_PAGE = 15;

export default function AlertsPage() {
    const { collaborators, loading: workOrdersLoading } = useWorkOrders();
    const { loading: authLoading } = useAuth();
    const loading = workOrdersLoading || authLoading;

    const [sortConfig, setSortConfig] = React.useState<{ key: keyof ExpirationAlertItem | null; direction: 'ascending' | 'descending' }>({ key: 'daysUntilExpiration', direction: 'ascending' });
    const [search, setSearch] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);

    const allExpiringItems = React.useMemo(() => {
        if (loading) return [];
        
        const alerts: ExpirationAlertItem[] = [];
        const today = new Date();
        
        collaborators.forEach(c => {
            const allItems = [
                ...(c.workClothing || []),
                ...(c.epp || []),
                ...(c.certifications || []),
            ];

            allItems.forEach(item => {
                if (!item) return;
                
                let expiration: Date | null = null;
                let expirationDateStr: string | undefined = undefined;

                if ('expirationDate' in item && item.expirationDate) {
                    expiration = parseISO(item.expirationDate);
                    expirationDateStr = item.expirationDate;
                } else if ('deliveryDate' in item && item.deliveryDate) {
                    expiration = addYears(parseISO(item.deliveryDate), 1);
                    expirationDateStr = expiration.toISOString().split('T')[0];
                } else if ('issueDate' in item && item.issueDate) {
                    expiration = addYears(parseISO(item.issueDate), 1);
                    expirationDateStr = expiration.toISOString().split('T')[0];
                }

                if (expiration && expirationDateStr) {
                    const daysUntilExpiration = differenceInDays(expiration, today);
                     alerts.push({
                        collaboratorId: c.id,
                        collaboratorName: c.name,
                        itemName: ('item' in item ? item.item : item.name) || 'Documento sin nombre',
                        daysUntilExpiration,
                        expirationDate: expirationDateStr,
                    });
                }
            });
        });

        return alerts;
    }, [collaborators, loading]);

    const requestSort = (key: keyof ExpirationAlertItem) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
          direction = 'descending';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const filteredItems = React.useMemo(() => {
        return allExpiringItems.filter(item => 
            item.collaboratorName.toLowerCase().includes(search.toLowerCase()) ||
            item.itemName.toLowerCase().includes(search.toLowerCase())
        );
    }, [allExpiringItems, search]);

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
    
    const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
    const paginatedItems = sortedItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
    
    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Alertas de Vencimiento</CardTitle>
                    <CardDescription>
                        Listado completo de EPP, ropa de trabajo y certificaciones vencidas o por vencer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-2">
                           {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <AlertsTable 
                            items={paginatedItems} 
                            search={search}
                            onSearchChange={setSearch}
                            sortConfig={sortConfig}
                            onSort={requestSort}
                        />
                    )}
                </CardContent>
                {totalPages > 1 && (
                     <CardFooter>
                        <div className="text-xs text-muted-foreground">
                            Página {currentPage} de {totalPages}
                        </div>
                        <div className="flex items-center space-x-2 ml-auto">
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviousPage}
                            disabled={currentPage === 1}
                            >
                            Anterior
                            </Button>
                            <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            >
                            Siguiente
                            </Button>
                        </div>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
