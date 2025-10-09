
'use client';
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { FileUp, FileDown, Loader2, Calendar as CalendarIcon, HardDriveDownload, Trash2, AlertTriangle, Wrench } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '../ui/calendar';
import { MultiSelect } from '../ui/multi-select';
import { useToast } from '@/hooks/use-toast';
import { exportOrdersToExcel } from '@/app/actions';
import { ImportOrdersDialog } from '@/components/orders/import-orders-dialog';
import { useWorkOrders } from '@/context/work-orders-context';
import * as xlsx from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function DataManagementCard() {
    const { workOrders, otStatuses, collaborators, vehicles, ganttCharts, reportTemplates, services, submittedReports, otCategories, fetchData, deleteAllData, deleteWorkOrders } = useWorkOrders();
    const [date, setDate] = React.useState<DateRange | undefined>();
    const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
    const [isExporting, setIsExporting] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = React.useState('');
    const [deleteOtConfirmationText, setDeleteOtConfirmationText] = React.useState('');
    const [isRepairing, setIsRepairing] = React.useState(false);
    const { toast } = useToast();

    const statusOptions = otStatuses.map(s => ({ value: s.name, label: s.name }));

    const handleExport = async () => {
        setIsExporting(true);
        try {
            let filteredForExport = [...workOrders];

            if (date?.from) {
                filteredForExport = filteredForExport.filter(order => {
                    if (!order.date) return false;
                    const orderDate = new Date(order.date.replace(/-/g, '/'));
                    return orderDate >= date.from!;
                });
            }
            if (date?.to) {
                filteredForExport = filteredForExport.filter(order => {
                    if (!order.date) return false;
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
    
    const handleDownloadJson = (data: any[], fileName: string) => {
        try {
            const replacer = (key: string, value: any) => {
                if (value && typeof value === 'object' && value.hasOwnProperty('seconds') && value.hasOwnProperty('nanoseconds')) {
                    return new Date(value.seconds * 1000 + value.nanoseconds / 1000000).toISOString();
                }
                return value;
            };

            const jsonString = JSON.stringify(data, replacer, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({ title: "Descarga Exitosa", description: `Se ha descargado el archivo ${fileName}.json.` });
        } catch (error) {
             console.error(`Error downloading ${fileName}: `, error);
             toast({ variant: "destructive", title: "Error de Descarga", description: `No se pudo generar el archivo para ${fileName}.` });
        }
    }

    const handleDownloadTemplate = () => {
        const wb = xlsx.utils.book_new();

        const mainSheetData = [{
            'Numero OT': "OT1001",
            'Descripción': "Instalación de sistema CCTV en bodega",
            'Cliente': "Cliente Ejemplo S.A.",
            'RUT': "76.123.456-7",
            'Servicio': "CCTV",
            'Fecha Ingreso': "2025-07-20",
            'Fecha Termino': "2025-07-25",
            'Estado': "Por Iniciar",
            'Prioridad': "Alta",
            'Precio Neto': 2500000,
            'Nº Orden de Compra': "OC-2025-987",
            'Encargados (nombres separados por coma)': "Juan Pérez, Ana García",
            'Técnicos (nombres separados por coma)': "Carlos Soto, Luis Torres",
            'Vehículos (patentes separadas por coma)': "PPU1111, PPU2222",
            'Comercial': "Vendedor Ejemplo",
            'Nº Venta': "NV-554",
            'HES/EM/MIGO': "HES-12345",
            'Vehículo Arrendado': "",
            'Notas': "Instalación de 4 cámaras domo y 2 bullet. NVR de 8 canales. El cliente solicita canalización embutida.",
            'Facturado': "No",
        }];
        
        const ws = xlsx.utils.json_to_sheet(mainSheetData, {cellDates: true});
        const headers = Object.keys(mainSheetData[0]);
        ws["!cols"] = headers.map(() => ({ wch: 35 }));
        
        const headerStyle = { font: { bold: true }, alignment: { wrapText: true, vertical: "top" } };
        headers.forEach((h, i) => {
            const cellRef = xlsx.utils.encode_cell({c:i, r:0});
            if(ws[cellRef]) ws[cellRef].s = headerStyle;
        });

        xlsx.utils.book_append_sheet(wb, ws, "Importación");
        
        const activeServices = services.filter(s => s.status === 'Activa').map(s => [s.name]);
        if(activeServices.length > 0) {
            const ws_services = xlsx.utils.aoa_to_sheet([["Servicios Válidos"], ...activeServices]);
            xlsx.utils.book_append_sheet(wb, ws_services, "Data_Servicios");
            if(ws['!dataValidation']) {
                ws['!dataValidation'].push({ sqref: `E2:E1000`, validation: { type: "list", allowBlank: false, showErrorMessage: true, formula1: `Data_Servicios!$A$2:$A$${activeServices.length + 1}` } });
            } else {
                ws['!dataValidation'] = [{ sqref: `E2:E1000`, validation: { type: "list", allowBlank: false, showErrorMessage: true, formula1: `Data_Servicios!$A$2:$A$${activeServices.length + 1}` } }];
            }
        }

        const validStatuses = otStatuses.map(s => [s.name]);
        if (validStatuses.length > 0) {
            const ws_statuses = xlsx.utils.aoa_to_sheet([["Estados Válidos"], ...validStatuses]);
            xlsx.utils.book_append_sheet(wb, ws_statuses, "Data_Estados");
            ws['!dataValidation'] = (ws['!dataValidation'] || []).concat([
                { sqref: `H2:H1000`, validation: { type: "list", allowBlank: false, showErrorMessage: true, formula1: `Data_Estados!$A$2:$A$${validStatuses.length + 1}` } },
            ]);
        }
        
        const priorities = [["Prioridades Válidas"], ["Baja"], ["Media"], ["Alta"]];
        const ws_priorities = xlsx.utils.aoa_to_sheet(priorities);
        xlsx.utils.book_append_sheet(wb, ws_priorities, "Data_Prioridades");
        ws['!dataValidation'] = (ws['!dataValidation'] || []).concat([
            { sqref: `I2:I1000`, validation: { type: "list", allowBlank: true, showErrorMessage: true, formula1: `Data_Prioridades!$A$2:$A$4` } },
        ]);

        const activeCollaborators = collaborators.filter(c => c.status === 'Activo').map(c => [c.name]);
        if (activeCollaborators.length > 0) {
            const ws_collaborators = xlsx.utils.aoa_to_sheet([["Colaboradores Válidos"],...activeCollaborators]);
            xlsx.utils.book_append_sheet(wb, ws_collaborators, "Data_Colaboradores");
        }

        const activeVehicles = vehicles.filter(v => v.status !== 'En Mantenimiento').map(v => [v.plate]);
        if(activeVehicles.length > 0) {
            const ws_vehicles = xlsx.utils.aoa_to_sheet([["Vehículos Válidos"],...activeVehicles]);
            xlsx.utils.book_append_sheet(wb, ws_vehicles, "Data_Vehiculos");
        }

        // Hide data sheets
        wb.SheetNames.slice(1).forEach(name => {
            if (wb.Sheets[name]) {
                if (!wb.Props) wb.Props = {};
                if (!wb.Props.SheetNames) wb.Props.SheetNames = [];
                const sheetIndex = wb.SheetNames.indexOf(name);
                if (!wb.Props.Sheet) wb.Props.Sheet = [];
                wb.Props.Sheet[sheetIndex] = { Hidden: 1 };
            }
        });

        const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "Plantilla_Importacion_Inteligente.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({ title: "Plantilla Generada", description: "Se ha descargado la plantilla con ejemplos y datos de referencia." });
    };
    
    const backupSections = [
        { title: 'Órdenes de Trabajo', data: workOrders, fileName: 'ordenes_de_trabajo' },
        { title: 'Colaboradores', data: collaborators, fileName: 'colaboradores' },
        { title: 'Vehículos', data: vehicles, fileName: 'vehiculos' },
        { title: 'Cartas Gantt', data: ganttCharts, fileName: 'cartas_gantt' },
        { title: 'Plantillas de Informes', data: reportTemplates, fileName: 'plantillas_informes' },
        { title: 'Informes Enviados', data: submittedReports, fileName: 'informes_enviados' },
        { title: 'Categorías OT', data: otCategories, fileName: 'categorias_ot' },
        { title: 'Estados OT', data: otStatuses, fileName: 'estados_ot' },
        { title: 'Servicios', data: services, fileName: 'servicios' },
    ];

    const handleDelete = async (action: 'all' | 'ots') => {
        setIsDeleting(true);
        try {
            if (action === 'all') {
                await deleteAllData();
                toast({
                    title: 'Base de Datos Limpiada',
                    description: 'Todos los datos (excepto colaboradores) han sido eliminados.',
                });
            } else {
                await deleteWorkOrders();
                toast({
                    title: 'Órdenes de Trabajo Eliminadas',
                    description: 'Todas las órdenes de trabajo han sido eliminadas.',
                });
            }
        } catch (e: any) {
            toast({
                variant: 'destructive',
                title: 'Error al Eliminar',
                description: `Ocurrió un error al limpiar la base de datos: ${e.message}`,
            });
        } finally {
            setIsDeleting(false);
            setDeleteConfirmationText('');
            setDeleteOtConfirmationText('');
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Importar y Exportar Órdenes de Trabajo</CardTitle>
                    <CardDescription>
                        Descarga una plantilla inteligente para añadir OTs masivamente o exporta los datos existentes con filtros.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col justify-between space-y-4">
                        <div>
                             <h4 className="font-semibold text-foreground">Importar desde Excel</h4>
                             <p className="text-sm text-muted-foreground">Utiliza la plantilla inteligente para asegurar la consistencia de los datos.</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" onClick={handleDownloadTemplate}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Descargar Plantilla
                            </Button>
                             <Button onClick={() => setIsImporting(true)}>
                                <FileUp className="mr-2 h-4 w-4" />
                                Importar Archivo
                            </Button>
                        </div>
                    </div>
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
                                    {format(date.from, "yyyy-MM-dd", {locale: es})} -{" "}
                                    {format(date.to, "yyyy-MM-dd", {locale: es})}
                                    </>
                                ) : (
                                    format(date.from, "yyyy-MM-dd", {locale: es})
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
                         <div className="flex justify-end pt-2">
                            <Button onClick={handleExport} disabled={isExporting}>
                                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                Exportar a Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Respaldo Completo de Datos</CardTitle>
                    <CardDescription>
                        Descarga una copia de seguridad de cada conjunto de datos de tu aplicación en formato JSON.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {backupSections.map(section => (
                       <Button 
                            key={section.fileName} 
                            variant="outline" 
                            onClick={() => handleDownloadJson(section.data, section.fileName)}
                        >
                           <HardDriveDownload className="mr-2 h-4 w-4" />
                           {section.title}
                       </Button>
                   ))}
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                        <div>
                            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
                            <CardDescription>
                                Las acciones en esta sección son irreversibles y pueden causar la pérdida permanente de datos.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                        <div>
                            <h4 className="font-semibold">Eliminar Solo Órdenes de Trabajo</h4>
                            <p className="text-sm text-muted-foreground">Esta acción borrará todas las OTs. Ideal para re-importar la base de datos.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Borrar OTs
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está seguro de que desea borrar TODAS las OTs?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Para confirmar, escribe <strong className="text-foreground">BORRAR OTS</strong> en el campo de abajo.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-2">
                                    <Label htmlFor="delete-ot-confirm" className="sr-only">Confirmación</Label>
                                    <Input 
                                        id="delete-ot-confirm"
                                        value={deleteOtConfirmationText}
                                        onChange={(e) => setDeleteOtConfirmationText(e.target.value)}
                                        placeholder='Escribe BORRAR OTS para confirmar'
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteOtConfirmationText('')}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete('ots')}
                                        disabled={deleteOtConfirmationText !== 'BORRAR OTS' || isDeleting}
                                    >
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sí, eliminar solo las OTs
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
                        <div>
                            <h4 className="font-semibold">Eliminar Todos los Datos</h4>
                            <p className="text-sm text-muted-foreground">Borrará OTs, vehículos, Gantts, etc. **Los colaboradores no se eliminarán**.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Borrar Todo
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta acción no se puede deshacer. Se eliminarán todos los datos (excepto los Colaboradores). Para confirmar, escribe <strong className="text-foreground">ELIMINAR</strong> en el campo de abajo.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-2">
                                    <Label htmlFor="delete-confirm" className="sr-only">Confirmación</Label>
                                    <Input 
                                        id="delete-confirm"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder='Escribe ELIMINAR para confirmar'
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeleteConfirmationText('')}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleDelete('all')}
                                        disabled={deleteConfirmationText !== 'ELIMINAR' || isDeleting}
                                    >
                                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Sí, eliminar todo lo demás
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
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

    