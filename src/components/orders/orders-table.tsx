

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
import type { WorkOrder, OTStatus } from '@/lib/types';
import { ArrowUpDown, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useWorkOrders } from '@/context/work-orders-context';
import { normalizeString } from '@/lib/utils';

interface OrdersTableProps {
    orders: WorkOrder[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof WorkOrder | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const { updateOrder, otStatuses, promptToCloseOrder, deleteOrder } = useWorkOrders();

  const getStatusVariant = (
    status: WorkOrder['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (normalizeString(status)) {
      case 'atrasada':
        return 'destructive';
      case 'cerrada':
      case 'facturado':
        return 'default';
      case 'por iniciar':
        return 'outline';
      case 'suspendida':
      case 'pendiente':
        return 'secondary';
      case 'en progreso':
        return 'default';
      default:
        return 'outline';
    }
  };
  
  const getStatusBadgeStyle = (status: WorkOrder['status']) => {
    if (normalizeString(status) === 'en progreso') {
      return { backgroundColor: 'hsl(142, 71%, 45%)', color: 'hsl(var(--primary-foreground))' };
    }
    return {};
  };

  
  const requestSort = (key: keyof WorkOrder) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const sortedData = [...orders].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      const valA = Array.isArray(aValue) ? aValue.join(', ') : aValue;
      const valB = Array.isArray(bValue) ? bValue.join(', ') : bValue;

      if (valA < valB) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (valA > valB) {
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
  
  const headerItems: { key: keyof WorkOrder, label: string }[] = [
      { key: 'ot_number', label: 'ID' },
      { key: 'description', label: 'Descripción' },
      { key: 'client', label: 'Cliente' },
      { key: 'service', label: 'Servicio' },
      { key: 'assigned', label: 'Encargado' },
      { key: 'comercial', label: 'Comercial' },
      { key: 'status', label: 'Estado' },
  ];

  const handleStatusChange = async (order: WorkOrder, newStatus: WorkOrder['status']) => {
    if (newStatus.toLowerCase() === 'cerrada') {
        promptToCloseOrder(order);
    } else {
        await updateOrder(order.id, { ...order, status: newStatus });
    }
  };

  return (
    <div className="space-y-4">
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-muted/50">
                <TableRow>
                    {headerItems.map((item) => (
                         <TableHead key={item.key}>
                            <Button variant="ghost" onClick={() => requestSort(item.key)}>
                                {item.label}
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                            </Button>
                        </TableHead>
                    ))}
                    <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {paginatedData.length > 0 ? (
                    paginatedData.map((order) => (
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
                          <TableCell>{order.assigned.join(', ')}</TableCell>
                          <TableCell>{order.comercial}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Badge 
                                        variant={getStatusVariant(order.status)} 
                                        style={getStatusBadgeStyle(order.status)}
                                        className="cursor-pointer"
                                    >
                                        {order.status}
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
                           <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Abrir menú</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/orders/${order.id}/edit`}>Editar</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
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
