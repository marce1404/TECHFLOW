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
import { Input } from '@/components/ui/input';
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

interface OrdersTableProps {
    orders: WorkOrder[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof WorkOrder | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  const { updateOrder } = useWorkOrders();

  const getStatusVariant = (
    status: WorkOrder['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (status) {
      case 'Cerrada':
        return 'default';
      case 'En Progreso':
        return 'secondary';
      case 'Atrasada':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const requestSort = (key: keyof WorkOrder) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = [...orders].sort((a, b) => {
    if (sortConfig.key) {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredData = sortedData.filter(
    (order) =>
      order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
      order.description.toLowerCase().includes(search.toLowerCase()) ||
      order.client.toLowerCase().includes(search.toLowerCase()) ||
      order.service.toLowerCase().includes(search.toLowerCase())
  );
  
  const headerItems: { key: keyof WorkOrder, label: string }[] = [
      { key: 'ot_number', label: 'ID' },
      { key: 'description', label: 'Descripción' },
      { key: 'client', label: 'Cliente' },
      { key: 'service', label: 'Servicio' },
      { key: 'assigned', label: 'Encargado' },
      { key: 'vendedor', label: 'Vendedor' },
      { key: 'status', label: 'Estado' },
  ];

  const statuses: WorkOrder['status'][] = ['Por Iniciar', 'En Progreso', 'Pendiente', 'Atrasada', 'Cerrada'];

  const handleStatusChange = (order: WorkOrder, newStatus: WorkOrder['status']) => {
    const updatedOrder = { ...order, status: newStatus };
    updateOrder(order.id, updatedOrder);
  };

  return (
    <div className="space-y-4 mt-4">
        <Input
            placeholder="Buscar por ID, cliente, servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
        />
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
                    <TableHead>Facturado</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredData.length > 0 ? (
                    filteredData.map((order) => (
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
                        <TableCell>{order.assigned}</TableCell>
                        <TableCell>{order.vendedor}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="p-0 h-auto">
                                  <Badge variant={getStatusVariant(order.status)} className="cursor-pointer">
                                      {order.status}
                                  </Badge>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {statuses.map(status => (
                                  <DropdownMenuItem key={status} onSelect={() => handleStatusChange(order, status)}>
                                    {status}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        <TableCell>
                          {order.facturado ? <CheckCircle className="h-5 w-5 text-green-500" /> : '-'}
                        </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                            No hay resultados.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
                Mostrando {filteredData.length} de {orders.length} órdenes.
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>Anterior</Button>
                <span>Página 1 de 1</span>
                <Button variant="outline" size="sm" disabled>Siguiente</Button>
            </div>
        </div>
    </div>
  );
}
