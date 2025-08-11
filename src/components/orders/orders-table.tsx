'use client';
import { useState } from 'react';
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
import { activeWorkOrders } from '@/lib/placeholder-data';
import type { WorkOrder } from '@/lib/types';
import { ArrowUpDown } from 'lucide-react';

export default function OrdersTable() {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof WorkOrder; direction: 'ascending' | 'descending' } | null>(null);

  const getStatusVariant = (
    status: WorkOrder['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Cerrada': return 'default';
      case 'En Progreso': return 'secondary';
      case 'Atrasada': return 'destructive';
      case 'Por Iniciar': return 'outline';
      case 'Pendiente':
      default:
        return 'outline';
    }
  };

  const sortedData = [...activeWorkOrders].sort((a, b) => {
    if (sortConfig !== null) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredData = sortedData.filter(
    (order) =>
      order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
      order.client.toLowerCase().includes(search.toLowerCase()) ||
      order.service.toLowerCase().includes(search.toLowerCase())
  );

  const requestSort = (key: keyof WorkOrder) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  return (
    <div className="space-y-4">
        <Input
            placeholder="Buscar por Nº OT, cliente o servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
        />
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('ot_number')}>ID <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('description')}>Descripción <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('client')}>Cliente <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('service')}>Servicio <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('assigned')}>Encargado <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead><Button variant="ghost" onClick={() => requestSort('status')}>Estado <ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredData.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.ot_number}</TableCell>
                    <TableCell>{order.description}</TableCell>
                    <TableCell>{order.client}</TableCell>
                    <TableCell>{order.service}</TableCell>
                    <TableCell>{order.assigned}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
