

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
import type { SubmittedReport } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReportsHistoryPage() {
  const { submittedReports, loading } = useWorkOrders();
  const [search, setSearch] = React.useState('');

  const filteredReports = React.useMemo(() => {
    if (!search) return submittedReports;

    return submittedReports.filter(report =>
      report.otDetails.ot_number.toLowerCase().includes(search.toLowerCase()) ||
      report.otDetails.client.toLowerCase().includes(search.toLowerCase()) ||
      report.templateName.toLowerCase().includes(search.toLowerCase())
    );
  }, [submittedReports, search]);
  
  if (loading) {
    return <div>Cargando informes...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Informes Guardados</CardTitle>
          <CardDescription>
            Consulta y gestiona todos los informes y guías de servicio que se han completado.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-end gap-4 mb-4">
              <Input
                  placeholder="Buscar por Nº OT, cliente, plantilla..."
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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plantilla Utilizada</TableHead>
                    <TableHead>Fecha de Envío</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length > 0 ? (
                    filteredReports.map((report: SubmittedReport) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.otDetails.ot_number}</TableCell>
                        <TableCell>{report.otDetails.client}</TableCell>
                        <TableCell>{report.templateName}</TableCell>
                        <TableCell>{report.submittedAt ? format(report.submittedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline">
                            <Link href={`/reports/${report.id}/print`} target="_blank">
                              <Printer className="mr-2 h-4 w-4" />
                              Ver / Imprimir
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No se han guardado informes todavía.
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
