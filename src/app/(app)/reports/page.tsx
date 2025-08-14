
'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useWorkOrders } from '@/context/work-orders-context';
import type { WorkOrder } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilePlus2 } from 'lucide-react';

export default function ReportsPage() {
  const { activeWorkOrders } = useWorkOrders();
  const [search, setSearch] = React.useState('');

  const filteredOrders = React.useMemo(() => {
    return activeWorkOrders.filter(order =>
      order.ot_number.toLowerCase().includes(search.toLowerCase()) ||
      order.description.toLowerCase().includes(search.toLowerCase()) ||
      order.client.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeWorkOrders, search]);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Generar Informe o Guía de Servicio</CardTitle>
          <CardDescription>
            Selecciona una Orden de Trabajo activa para completar su informe o guía correspondiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por Nº de OT, descripción o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº OT</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order: WorkOrder) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.ot_number}</TableCell>
                      <TableCell>{order.description}</TableCell>
                      <TableCell>{order.client}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild>
                          <Link href={`/reports/new?ot_number=${order.ot_number}`}>
                            <FilePlus2 className="mr-2 h-4 w-4" />
                            Llenar Informe
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No hay órdenes de trabajo activas que coincidan con tu búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
