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
import { ArrowUpDown, CheckCircle } from 'lucide-react';

export default function OrdersTable() {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof WorkOrder; direction: 'ascending' | 'descending' } | null>(null);

  const getStatusVariant = (
    status: WorkOrder['status']
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
     switch (status) {
      case 'En Progreso':
        return 'default';
      case 'Pendiente':
        return 'secondary'; // Using secondary for yellow-ish as in image
      case 'Por Iniciar':
        return 'destructive'; // Using destructive for violet-ish as in image
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
    <div className="space-y-4 mt-4">
        <Input
            placeholder="Buscar por ID, cliente, servicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
        />
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Encargado</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Facturado</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {filteredData.map((order) => (
                    <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div>{order.ot_number}</div>
                      <div className="text-xs text-muted-foreground">{order.date}</div>
                    </TableCell>
                    <TableCell>{order.description}</TableCell>
                    <TableCell>{order.client}</TableCell>
                    <TableCell>{order.service}</TableCell>
                    <TableCell>{order.assigned}</TableCell>
                    <TableCell>{order.vendedor}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="text-white">
                            {order.status}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      {order.facturado ? <CheckCircle className="h-5 w-5 text-green-500" /> : '-'}
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
                Mostrando {filteredData.length} de {activeWorkOrders.length} órdenes.
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