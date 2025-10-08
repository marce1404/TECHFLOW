
'use client';
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { FileUp, FileDown, Loader2, Calendar as CalendarIcon, HardDriveDownload, Wrench } from 'lucide-react';
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
import { Separator } from '../ui/separator';
import * as xlsx from 'xlsx';
import type { WorkOrder } from '@/lib/types';
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
    const { workOrders, otStatuses, collaborators, vehicles, ganttCharts, reportTemplates, services, submittedReports, otCategories, fetchData, updateOrder } = useWorkOrders();
    const [date, setDate] = React.useState<DateRange | undefined>();
    const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);
    const [isExporting, setIsExporting] = React.useState(false);
    const [isImporting, setIsImporting] = React.useState(false);
    const [isFixing, setIsFixing] = React.useState(false);
    const { toast } = useToast();

    const statusOptions = otStatuses.map(s => ({ value: s.name, label: s.name }));

    const handleExport = async () => {
        setIsExporting(true);
        try {
            let filteredForExport = [...workOrders];

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
            'Fecha Inicio': "2025-07-20",
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
    
    const handleFixImportedData = async () => {
        setIsFixing(true);
        toast({ title: "Iniciando corrección...", description: "Este proceso puede tardar unos minutos." });

        const activeOtNumbers = new Set([
            'OT1374', 'OT-1498', 'OT-1519', 'OT-1510', 'OT-1511', 'OT-1508', 'OT-1524',
            'OT-1522', 'OT-1505', 'OT-1528', 'OT-1531', 'OT-1529', 'OT-1530', 'OT-1533',
            'OT-1532', 'OT-1536', 'OT-1542', 'OT-1513', 'OT-1539', 'OT-1540', 'OT-1534',
            'OT-1537', 'OT-1557', 'OT-1556', 'OT-1545', 'OT-1564', 'OT-1543', 'OT-1544',
            'OT-1569', 'OT-1560', 'OT-1500', 'OT-1541', 'OT-1526', 'OT-1572', 'OT-1568',
            'OT-1547', 'OT-1535', 'OT-1562', 'OT-1553', 'OT-1550', 'OT-1570', 'OT-1565',
            'OT-1561', 'OT-1555', 'OT-1538', 'OT-1577', 'OT-1563', 'OT-1549', 'OT-1558',
            'OT-1581', 'OT-1586', 'OT-1546', 'OT-1554', 'OT-1579', 'OT-1567', 'OT-1590',
            'OT-1594', 'OT-1551', 'OT-1512', 'OT-1552', 'OT-1587', 'OT-1584', 'OT-1604',
            'OT-1591', 'OT-1585', 'OT-1592', 'OT-1605', 'OT-1601', 'OT-1608', 'OT-1580',
            'OT-1596', 'OT-1602', 'OT-1559', 'OT-1595', 'OT-1609', 'OT-1578'
        ]);
        
        const ordersToFix = workOrders.filter(order => {
          const isPorIniciar = order.status === 'Por Iniciar';
          const isEnProgreso = order.status === 'En Progreso';
          const isActiveStatus = isPorIniciar || isEnProgreso;

          return isActiveStatus && !activeOtNumbers.has(order.ot_number);
        });

        if (ordersToFix.length === 0) {
            toast({ title: "No hay nada que corregir", description: "No se encontraron OTs importadas con estado incorrecto." });
            setIsFixing(false);
            return;
        }

        let successCount = 0;
        let errorCount = 0;
        
        for (const order of ordersToFix) {
            try {
                await updateOrder(order.id, {
                    status: 'Cerrada',
                    endDate: order.endDate || order.date, // Use endDate if exists, otherwise fallback to date
                });
                successCount++;
            } catch (e) {
                console.error(`Failed to update OT ${order.ot_number}:`, e);
                errorCount++;
            }
        }
        
        if (errorCount > 0) {
             toast({
                variant: 'destructive',
                title: "Corrección finalizada con errores",
                description: `${successCount} OTs corregidas. ${errorCount} fallaron.`,
            });
        } else {
             toast({
                title: "Corrección Exitosa",
                description: `${successCount} órdenes de trabajo han sido actualizadas al estado 'Cerrada'.`,
            });
        }
        
        fetchData(); // re-fetch data to update the UI
        setIsFixing(false);
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
                    <CardTitle>Mantenimiento de Datos</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-sm text-muted-foreground">
                        Utiliza esta herramienta si importaste datos y el estado de las OTs no se asignó correctamente. Esto corregirá las OTs que deberían estar "Cerradas".
                    </p>
                </CardContent>
                <CardFooter>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Wrench className="mr-2 h-4 w-4" />
                                Corregir Estados de OTs Importadas
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar corrección de datos?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción revisará todas las OTs con estado "Por Iniciar" y las cambiará a "Cerrada" si no corresponden a una OT que deba estar activa.
                                    Este proceso no se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleFixImportedData} disabled={isFixing}>
                                    {isFixing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Sí, corregir datos
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
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
            
            <ImportOrdersDialog
                open={isImporting}
                onOpenChange={setIsImporting}
                onImportSuccess={fetchData}
            />
        </>
    );
}

