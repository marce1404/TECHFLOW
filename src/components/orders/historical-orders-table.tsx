

'use client';
import { useState } from 'react';
import Link from 'next/link';
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
import type { WorkOrder } from '@/lib/types';
import { ArrowUpDown, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWorkOrders } from '@/context/work-orders-context';
import { cn, normalizeString } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

interface HistoricalOrdersTableProps {
    orders: WorkOrder[];
}

export default function HistoricalOrdersTable({ orders }: HistoricalOrdersTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof WorkOrder | 'facturado' | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const { updateOrder, otStatuses, promptToCloseOrder } = useWorkOrders();
  const { userProfile } = useAuth();

  const canChangeStatus = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

   const getStatusVariant = (
    status: WorkOrder['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (normalizeString(status)) {
      case 'atrasada':
        return 'destructive';
      case 'cerrada':
        return 'outline';
      case 'suspendida':
      case 'pendiente':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getStatusBadgeClass = (status: WorkOrder['status']) => {
    const normalizedStatus = normalizeString(status);
    if (normalizedStatus === 'en progreso') {
      return 'bg-green-500 text-white border-transparent';
    }
     if (normalizedStatus === 'por iniciar') {
        return 'bg-primary text-primary-foreground border-transparent'
    }
     if (normalizedStatus === 'cerrada') {
        return 'bg-background text-foreground'
    }
    return '';
  };


  const requestSort = (key: keyof WorkOrder | 'facturado') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };
  
   const getInvoiceStatusSortValue = (order: WorkOrder): number => {
        if (order.facturado) return 3; // Fully invoiced (legacy)
        const totalInvoiced = (order.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
        const netPrice = order.netPrice || 0;
        if (netPrice > 0 && totalInvoiced >= netPrice) return 3; // Fully invoiced
        if (totalInvoiced > 0) return 2; // Partially invoiced
        if (netPrice > 0) return 1; // Invoiceable but not invoiced
        return 0; // Not invoiceable
    }

  const sortedData = [...orders].sort((a, b) => {
    if (sortConfig.key) {
        if (sortConfig.key === 'facturado') {
            const aValue = getInvoiceStatusSortValue(a);
            const bValue = getInvoiceStatusSortValue(b);
             if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
             if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
             return 0;
        }

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      const valA = Array.isArray(aValue) ? aValue.join(', ') : aValue;
      const valB = Array.isArray(bValue) ? bValue.join(', ') : bValue;

      if (valA! < valB!) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (valA! > valB!) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const headerItems: { key: keyof WorkOrder, label: string, className?: string }[] = [
      { key: 'ot_number', label: 'ID', className: 'w-[8%]' },
      { key: 'description', label: 'Descripción', className: 'w-[25%]' },
      { key: 'client', label: 'Cliente', className: 'w-[12%]' },
      { key: 'service', label: 'Servicio', className: 'w-[10%]' },
      { key: 'assigned', label: 'Encargado', className: 'w-[10%]' },
      { key: 'comercial', label: 'Comercial', className: 'w-[10%]' },
      { key: 'netPrice', label: 'Precio Neto', className: 'w-[10%]' },
      { key: 'status', label: 'Estado', className: 'w-[10%]' },
  ];

  const handleStatusChange = (order: WorkOrder, newStatus: WorkOrder['status']) => {
    if (newStatus.toLowerCase() === 'cerrada') {
        promptToCloseOrder(order);
    } else {
        updateOrder(order.id, { ...order, status: newStatus });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  }


  return (
    <div className="space-y-4">
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-muted/50">
                <TableRow>
                    {headerItems.map((item) => (
                        <TableHead key={item.key} className={item.className}>
                            <Button variant="ghost" onClick={() => requestSort(item.key)}>
                                {item.label}
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                    ))}
                    <TableHead className="w-[5%] text-center">
                        <Button variant="ghost" onClick={() => requestSort('facturado')}>
                            Facturado
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((order) => {
                        const totalInvoiced = (order.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
                        const netPrice = order.netPrice || 0;
                        let invoiceStatusIndicator = null;
                        
                        const isFullyInvoicedByFlag = order.facturado === true;
                        const isFullyInvoicedByAmount = netPrice > 0 && totalInvoiced >= netPrice;

                        if (isFullyInvoicedByFlag || isFullyInvoicedByAmount) {
                             invoiceStatusIndicator = <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />;
                        } else if (totalInvoiced > 0 && netPrice > 0) {
                            const percentageInvoiced = Math.round((totalInvoiced / netPrice) * 100);
                            invoiceStatusIndicator = (
                                <Badge variant="outline" className="border-green-500 text-green-600 font-bold">
                                    {percentageInvoiced}%
                                </Badge>
                            );
                        }

                        return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            <Link href={`/orders/${order.id}/edit`} className="text-primary hover:underline">
                              {order.ot_number}
                            </Link>
                            <div className="text-xs text-muted-foreground">{order.date}</div>
                          </TableCell>
                          <TableCell>{order.description}</TableCell>
                          <TableCell>{order.client}</TableCell>
                          <TableCell>{order.service}</TableCell>
                          <TableCell>{Array.isArray(order.assigned) ? order.assigned.join(', ') : order.assigned}</TableCell>
                          <TableCell>{order.comercial}</TableCell>
                           <TableCell className="text-right">{formatCurrency(order.netPrice)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild disabled={!canChangeStatus}>
                                    <Badge 
                                        variant={getStatusVariant(order.status)} 
                                        className={cn(canChangeStatus && "cursor-pointer", getStatusBadgeClass(order.status))}
                                    >
                                        {order.status.toUpperCase()}
                                    </Badge>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {otStatuses.map(status => (
                                        <DropdownMenuItem key={status.id} onSelect={() => handleStatusChange(order, status.name as WorkOrder['status'])}>
                                            {status.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="text-center">
                            {invoiceStatusIndicator}
                          </TableCell>
                        </TableRow>
                    )})
                ) : (
                    <TableRow>
                        <TableCell colSpan={headerItems.length + 1} className="h-24 text-center">
                            No hay resultados.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
                Mostrando {paginatedData.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length} órdenes.
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
