
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
import type { SubmittedReport, AppUser } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Printer, Mail, FilePenLine, ChevronRight, Trash2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SendReportByEmailDialog } from '@/components/reports/send-report-by-email-dialog';
import { useAuth } from '@/context/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
} from "@/components/ui/alert-dialog"

export default function ReportsHistoryPage() {
  const { submittedReports, otCategories, loading, deleteSubmittedReport } = useWorkOrders();
  const { users, userProfile } = useAuth();
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('todos');
  const [selectedReport, setSelectedReport] = React.useState<SubmittedReport | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 15;


  const categories = [
    { id: "todos", value: "todos", label: "Todos", prefix: 'todos' },
    ...otCategories.map(cat => ({
      id: cat.id,
      value: cat.prefix,
      label: `${cat.name} (${cat.prefix})`,
      prefix: cat.prefix,
    }))
  ];

  const filteredReports = React.useMemo(() => {
    let reports = submittedReports;
    
    if (activeTab !== 'todos') {
        reports = reports.filter(report => report.otDetails.ot_number.startsWith(activeTab));
    }

    if (search) {
      reports = reports.filter(report =>
        report.otDetails.ot_number.toLowerCase().includes(search.toLowerCase()) ||
        report.otDetails.client.toLowerCase().includes(search.toLowerCase()) ||
        report.templateName.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return reports.sort((a, b) => b.submittedAt.toMillis() - a.submittedAt.toMillis());
  }, [submittedReports, search, activeTab]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
  const paginatedReports = filteredReports.slice(
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
  }, [activeTab, search]);


  const handleSendEmailClick = (report: SubmittedReport) => {
    setSelectedReport(report);
    setIsEmailDialogOpen(true);
  };
  
  const getReportManager = (report: SubmittedReport): AppUser | undefined => {
      const managerName = report.otDetails.comercial;
      if (!managerName) return undefined;
      return users.find(u => u.displayName === managerName);
  };

  if (loading) {
    return <div>Cargando informes...</div>;
  }

  return (
    <>
      <div className="flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Informes Guardados</CardTitle>
            <CardDescription>
              Consulta y gestiona todos los informes y guías de servicio que se han completado.
            </CardDescription>
          </CardHeader>
          <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                      <ScrollArea className="w-full sm:w-auto">
                          <TabsList className="w-max">
                              {categories.map(cat => (
                                  <TabsTrigger key={cat.id} value={cat.prefix}>{cat.label}</TabsTrigger>
                              ))}
                          </TabsList>
                          <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                      <div className="flex w-full sm:w-auto items-center gap-2">
                          <Input
                              placeholder="Buscar por Nº OT, cliente, plantilla..."
                              value={search}
                              onChange={(e) => setSearch(e.target.value)}
                              className="w-full sm:max-w-sm"
                          />
                      </div>
                  </div>
                  <TabsContent value={activeTab}>
                      <div className="hidden md:block">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                <TableRow>
                                    <TableHead>Nº OT</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Plantilla Utilizada</TableHead>
                                    <TableHead>Fecha de Envío</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                                </TableHeader>
                                <TableBody>
                                {paginatedReports.length > 0 ? (
                                    paginatedReports.map((report: SubmittedReport) => (
                                    <TableRow key={report.id}>
                                        <TableCell className="font-medium">
                                            <Link href={`/reports/${report.id}/edit`} className="text-primary hover:underline">
                                                {report.otDetails.ot_number}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{report.otDetails.client}</TableCell>
                                        <TableCell>{report.templateName}</TableCell>
                                        <TableCell>{report.submittedAt ? format(report.submittedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/reports/${report.id}/edit`}>
                                                                <FilePenLine className="mr-2 h-4 w-4" /> Editar
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleSendEmailClick(report)}>
                                                            <Mail className="mr-2 h-4 w-4" /> Enviar por correo
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/reports/${report.id}/print`} target="_blank">
                                                                <Printer className="mr-2 h-4 w-4" /> Ver/Imprimir
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el informe para la OT
                                                            <span className="font-bold"> {report.otDetails.ot_number}</span>.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive hover:bg-destructive/90"
                                                            onClick={() => deleteSubmittedReport(report.id)}
                                                        >
                                                            Sí, eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No se han guardado informes que coincidan con tu búsqueda.
                                    </TableCell>
                                    </TableRow>
                                )}
                                </TableBody>
                            </Table>
                        </div>
                      </div>
                      <div className="md:hidden space-y-4">
                        {paginatedReports.length > 0 ? (
                            paginatedReports.map((report) => (
                                <Card key={report.id} className="relative">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">{report.otDetails.ot_number}</CardTitle>
                                             <Link href={`/reports/${report.id}/edit`} className="absolute inset-0 z-10"><span className="sr-only">Ver detalles</span></Link>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <CardDescription>{report.otDetails.client}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm font-medium">{report.templateName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {report.submittedAt ? format(report.submittedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="flex justify-end gap-2 relative z-20">
                                        <Button size="icon" variant="outline" onClick={(e) => { e.stopPropagation(); handleSendEmailClick(report); }}>
                                            <Mail className="h-4 w-4" />
                                            <span className="sr-only">Enviar por correo</span>
                                        </Button>
                                        <Button size="icon" variant="outline" asChild onClick={(e) => e.stopPropagation()}>
                                            <Link href={`/reports/${report.id}/print`} target="_blank">
                                            <Printer className="h-4 w-4" />
                                            <span className="sr-only">Ver / Imprimir</span>
                                            </Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                No se han guardado informes que coincidan con tu búsqueda.
                            </div>
                        )}
                      </div>
                  </TabsContent>
              </Tabs>
          </CardContent>
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
        </Card>
      </div>
      <SendReportByEmailDialog
        open={isEmailDialogOpen}
        onOpenChange={setIsEmailDialogOpen}
        report={selectedReport}
        reportManager={selectedReport ? getReportManager(selectedReport) : undefined}
        currentUser={userProfile || undefined}
      />
    </>
  );
}
