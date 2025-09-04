
'use client';

import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function AuditLogPage() {
    const { auditLog, loading } = useWorkOrders();
    const [currentPage, setCurrentPage] = React.useState(1);
    const [search, setSearch] = React.useState('');
    const itemsPerPage = 20;

    const filteredLogs = React.useMemo(() => {
        if (!auditLog) return [];
        return auditLog.filter(log => 
            log.user.toLowerCase().includes(search.toLowerCase()) ||
            log.action.toLowerCase().includes(search.toLowerCase())
        );
    }, [auditLog, search]);
    
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
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
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex-1">
                            <CardTitle>Registro de Auditoría</CardTitle>
                            <CardDescription>
                                Un registro de las acciones importantes realizadas en el sistema.
                            </CardDescription>
                        </div>
                        <div className="w-full md:w-auto md:max-w-sm">
                             <Input
                                placeholder="Buscar por usuario o acción..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Fecha y Hora</TableHead>
                                    <TableHead className="w-[180px]">Usuario</TableHead>
                                    <TableHead>Acción Realizada</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(10)].map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-1/2" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paginatedLogs.length > 0 ? (
                                    paginatedLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>{format(log.timestamp.toDate(), 'dd/MM/yyyy HH:mm:ss', { locale: es })}</TableCell>
                                            <TableCell className="font-medium">{log.user}</TableCell>
                                            <TableCell>{log.action}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center">
                                            No hay registros de auditoría para mostrar.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
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
