
'use client';
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { FileUp, FileDown, Loader2, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { MultiSelect } from '../ui/multi-select';
import { OTStatus, WorkOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { exportOrdersToExcel, deleteAllWorkOrdersAction } from '@/app/actions';
import { ImportOrdersDialog } from '@/components/orders/import-orders-dialog';
import { useWorkOrders } from '@/context/work-orders-context';
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
} from "@/components/ui/alert-dialog";

export default function DataManagementCard() {
    const { activeWorkOrders, historicalWorkOrders, otStatuses, fetchData } = useWorkOrders();
    const [date, setDate] = React.useState<DateRange | undefined>();
    const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
    const [isExporting, setIsExporting] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const { toast } = useToast();

    const statusOptions = otStatuses.map(s => ({ value: s.name, label: s.name }));

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const allOrders = [...activeWorkOrders, ...historicalWorkOrders];
            let filteredForExport = [...allOrders];

            if (date?.from) {
                filteredForExport = filteredForExport.filter(order => {
                    const orderDate = new Date(order.date.replace(/-/g, '/'));
                    return orderDate >= date.from!;
                });
            }
            if (date?.to) {
                filteredForExport = filteredForExport.filter(order => {
                    const orderDate = new Date(order.date.replace(/-/g, '/'));
                    return orderDate <= date.to!;
                });
            }
            if (selectedStatuses.length > 0) {
                filteredForExport = filteredForExport.filter(order => selectedStatuses.includes(order.status));
            }

            if (filteredForExport.length === 0) {
                toast({ variant: "destructive", title: "Sin Datos", description: "No hay órdenes que coincidan con los filtros seleccionados." });
                setIsExporting(false);
                return;
            }

            const base64 = await exportOrdersToExcel(filteredForExport);
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Reporte_OT.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Exportación Exitosa", description: `${filteredForExport.length} órdenes han sido exportadas.` });
        } catch (error) {
            console.error("Error exporting to Excel: ", error);
            toast({ variant: "destructive", title: "Error de Exportación", description: "No se pudo generar el archivo de Excel." });
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleClearDatabase = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteAllWorkOrdersAction();
            if (result.success) {
                toast({ title: "Base de Datos Limpiada", description: result.message });
                await fetchData(); // Refresh data in context
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        } catch (error) {
            console.error("Error clearing database: ", error);
            toast({ variant: "destructive", title: "Error Inesperado", description: "No se pudo completar la operación de limpieza." });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Importar y Exportar Órdenes de Trabajo</CardTitle>
                    <CardDescription>
                        Gestiona tus órdenes masivamente. Puedes aplicar filtros antes de exportar todas las órdenes del sistema (activas e históricas).
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-foreground">Filtros de Exportación (Opcional)</h4>
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date?.from ? (
                                date.to ? (
                                    <>
                                    {format(date.from, "dd/MM/yyyy", {locale: es})} -{" "}
                                    {format(date.to, "dd/MM/yyyy", {locale: es})}
                                    </>
                                ) : (
                                    format(date.from, "dd/MM/yyyy", {locale: es})
                                )
                                ) : (
                                <span>Seleccionar rango de fechas</span>
                                )}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={2}
                                locale={es}
                            />
                            </PopoverContent>
                        </Popover>
                        <MultiSelect
                            options={statusOptions}
                            selected={selectedStatuses}
                            onChange={setSelectedStatuses}
                            placeholder="Filtrar por estado..."
                        />
                    </div>
                    <div className="flex items-end justify-end gap-2">
                         <Button variant="outline" onClick={() => setIsImporting(true)} className="h-10">
                            <FileDown className="mr-2 h-4 w-4" />
                            Importar
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting} className="h-10">
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                            Exportar Órdenes
                        </Button>
                    </div>
                </CardContent>
            </Card>

             <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                    <CardDescription>
                       Esta acción eliminará permanentemente todas las órdenes de trabajo de la base de datos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Limpiar Base de Datos de OTs
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminarán permanentemente TODAS las órdenes de trabajo de la base de datos. Esto es útil si quieres empezar de cero con una nueva importación.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-destructive hover:bg-destructive/90"
                                    onClick={handleClearDatabase}
                                >
                                    Sí, eliminar todo
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            <ImportOrdersDialog
                open={isImporting}
                onOpenChange={setIsImporting}
                onImportSuccess={fetchData}
            />
        </>
    );
}
