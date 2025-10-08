
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileUp, Loader2, UploadCloud, CheckCircle, FileWarning } from 'lucide-react';
import * as xlsx from 'xlsx';
import type { CreateWorkOrderInput, WorkOrder } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useWorkOrders } from '@/context/work-orders-context';
import { normalizeString } from '@/lib/utils';
import { format, parse, isValid, getYear } from 'date-fns';
import { Progress } from '../ui/progress';

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

type ImportStep = 'selectFile' | 'confirmDuplicates' | 'showResult';

export function ImportOrdersDialog({ open, onOpenChange, onImportSuccess }: ImportOrdersDialogProps) {
  const { collaborators, addOrder, services: availableServices, otStatuses, workOrders, updateOrder } = useWorkOrders();
  const [file, setFile] = React.useState<File | null>(null);
  const [newOrders, setNewOrders] = React.useState<CreateWorkOrderInput[]>([]);
  const [duplicateOrders, setDuplicateOrders] = React.useState<CreateWorkOrderInput[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
  const [step, setStep] = React.useState<ImportStep>('selectFile');
  const [importProgress, setImportProgress] = React.useState(0);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };
  
    const findMatchingCollaborator = (name: string): string => {
        if (!name?.trim()) return '';
        const normalizedName = normalizeString(name);

        const exactMatch = collaborators.find(c => normalizeString(c.name) === normalizedName);
        if (exactMatch) return exactMatch.name;
        
        const partialMatch = collaborators.find(c => normalizeString(c.name).includes(normalizedName));
        
        return partialMatch ? partialMatch.name : name;
    };


  const findMatchingString = (input: string, validList: {name: string}[]) => {
      if (!input?.trim()) return input;
      const normalizedInput = normalizeString(input);
      const found = validList.find(item => normalizeString(item.name) === normalizedInput);
      return found?.name || input;
  }
  
  const excelSerialDateToJSDate = (serial: number) => {
    if (typeof serial !== 'number' || serial < 1) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const timezoneOffset = date_info.getTimezoneOffset() * 60000;
    return new Date(date_info.getTime() + timezoneOffset);
  }
  
    const robustDateParse = (dateInput: any): string | null => {
        if (dateInput === null || dateInput === undefined || dateInput === '') return null;

        if (dateInput instanceof Date && isValid(dateInput)) {
            return format(dateInput, 'yyyy-MM-dd');
        }
        
        if (typeof dateInput === 'number' && dateInput > 1) {
            const date = excelSerialDateToJSDate(dateInput);
            if (date && isValid(date)) {
                return format(date, 'yyyy-MM-dd');
            }
        }

        if (typeof dateInput === 'string' && dateInput.trim() !== '') {
            const trimmedDateInput = dateInput.trim();
            
            const monthNames: { [key: string]: number } = {
                enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
                julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
            };
            const normalizedMonth = normalizeString(trimmedDateInput.split(' ')[0]);
            if (monthNames[normalizedMonth] !== undefined) {
                const currentYear = getYear(new Date());
                return format(new Date(currentYear, monthNames[normalizedMonth], 1), 'yyyy-MM-dd');
            }

            const formats = ['dd/MM/yyyy', 'd/M/yy', 'yyyy-MM-dd', 'd-M-yy', 'dd-MM-yyyy', 'MM/dd/yyyy'];
            for (const fmt of formats) {
                try {
                    const parsedDate = parse(trimmedDateInput, fmt, new Date());
                    if (isValid(parsedDate)) {
                        return format(parsedDate, 'yyyy-MM-dd');
                    }
                } catch (e) {}
            }
        }
        return null;
    };

    const mapFactprocToStatus = (factprocValue: string | undefined): WorkOrder['status'] => {
        if (!factprocValue || typeof factprocValue !== 'string') return 'Por Iniciar';
    
        const normalizedFactproc = normalizeString(factprocValue.trim());
    
        if (normalizedFactproc === 'terminada') {
            return 'Terminada';
        }
        if (normalizedFactproc === 'cerrada' || normalizedFactproc === 'facturado') {
            return 'Cerrada';
        }
        if (normalizedFactproc === 'en proceso') {
            return 'En Progreso';
        }
        if (normalizedFactproc === 'por iniciar') {
            return 'Por Iniciar';
        }

        const foundStatus = otStatuses.find(s => normalizeString(s.name) === normalizedFactproc);
        if (foundStatus) {
            return foundStatus.name as WorkOrder['status'];
        }
    
        return 'Por Iniciar';
    }


  const parseFile = (fileToParse: File) => {
    setLoading(true);
    setErrors([]);
    setNewOrders([]);
    setDuplicateOrders([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = xlsx.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
            setErrors(["El archivo está vacío o no tiene datos."]);
            setLoading(false);
            return;
        }
        
        const headers: { original: string, normalized: string }[] = xlsx.utils.sheet_to_json<string[]>(worksheet, { header: 1 })[0]
            .map(h => ({ original: String(h), normalized: normalizeString(String(h)).replace(/[^a-z0-9]/gi, '') }));
        
        const findHeader = (variants: string[]) => {
            for (const variant of variants) {
                const normalizedVariant = normalizeString(variant).replace(/[^a-z0-9]/gi, '');
                const header = headers.find(h => h.normalized === normalizedVariant);
                if (header) return header.original;
            }
            return null;
        };
        
        const keyMapping = {
            ot_number: findHeader(['OT', 'n ot', 'numero ot']),
            date: findHeader(['Fecha Ingreso']),
            description: findHeader(['NOMBRE DEL PROYECTO', 'descripcion']),
            client: findHeader(['cliente']),
            rut: findHeader(['rut']),
            comercial: findHeader(['vendedor']),
            assigned: findHeader(['SUPERV', 'encargado', 'encargados']),
            technicians: findHeader(['tecnico', 'técnico', 'tecnicos']),
            service: findHeader(['SISTEMA', 'servicio']),
            netPrice: findHeader(['MONTO NETO']),
            status: findHeader(['FACTPROCES', 'estado']),
            hesEmMigo: findHeader(['hes/em/migo', 'emhesmigo', 'em-hes-migo']),
            ocNumber: findHeader(['OC', 'nordencompra']),
            saleNumber: findHeader(['nventa', 'n de venta']),
            invoiceNumber: findHeader(['Fact. N°']),
            invoiceDate: findHeader(['Fecha Fact.']),
            billingMonth: findHeader(['mesfac']),
            endDate: findHeader(['fechatermino', 'fecha termino']),
            rentedVehicle: findHeader(['vehiculoarrendado', 'arriendovehiculo']),
            notes: findHeader(['Notas']),
        };
        
        const validationErrors: string[] = [];
        const groupedByOt = new Map<string, any[]>();
        
        jsonData.forEach((row) => {
            const otNumber = keyMapping.ot_number ? String(row[keyMapping.ot_number] || '').trim() : '';
            if (otNumber) {
                if (!groupedByOt.has(otNumber)) {
                    groupedByOt.set(otNumber, []);
                }
                groupedByOt.get(otNumber)!.push(row);
            }
        });

        const tempNewOrders: CreateWorkOrderInput[] = [];
        const tempDuplicateOrders: CreateWorkOrderInput[] = [];

        const existingOtNumbers = new Set(workOrders.map(wo => String(wo.ot_number).trim()));

        groupedByOt.forEach((rows, otNumber) => {
            const firstRow = rows[0];
            
            let finalDate: string | null = null;
            for(const row of rows) {
                const dateVal = keyMapping.date ? row[keyMapping.date] : null;
                finalDate = robustDateParse(dateVal);
                if (finalDate) break;
            }

            const rawNetPrice = keyMapping.netPrice ? firstRow[keyMapping.netPrice] : 0;
            let finalNetPrice = 0;
            if (typeof rawNetPrice === 'number') {
                finalNetPrice = rawNetPrice;
            } else if (typeof rawNetPrice === 'string' && rawNetPrice.trim()) {
                const cleanedPrice = rawNetPrice.replace(/[$. ]/g, '').replace(',', '.');
                finalNetPrice = parseFloat(cleanedPrice) || 0;
            }

            const parseCollaborators = (key: 'assigned' | 'technicians' | 'comercial'): string[] | string => {
                const header = keyMapping[key];
                if (!header || !firstRow[header]) return key === 'comercial' ? '' : [];
                const value = String(firstRow[header]);
                const names = value.split(/[,;]/).map(name => findMatchingCollaborator(name.trim())).filter(Boolean);
                return key === 'comercial' ? names[0] || '' : names;
            };

            const orderData: CreateWorkOrderInput = {
                ot_number: otNumber,
                description: String(firstRow[keyMapping.description!] || ''),
                client: String(firstRow[keyMapping.client!] || ''),
                date: finalDate || '',
                endDate: (keyMapping.endDate ? robustDateParse(firstRow[keyMapping.endDate!]) : null) || '',
                service: keyMapping.service ? findMatchingString(String(firstRow[keyMapping.service] || ''), availableServices) : '',
                status: keyMapping.status ? mapFactprocToStatus(String(firstRow[keyMapping.status])) : 'Por Iniciar',
                priority: 'Baja',
                netPrice: finalNetPrice,
                assigned: parseCollaborators('assigned') as string[],
                technicians: parseCollaborators('technicians') as string[],
                comercial: parseCollaborators('comercial') as string,
                ocNumber: String(firstRow[keyMapping.ocNumber!] || ''),
                rut: String(firstRow[keyMapping.rut!] || ''),
                saleNumber: String(firstRow[keyMapping.saleNumber!] || ''),
                hesEmMigo: String(firstRow[keyMapping.hesEmMigo!] || ''),
                notes: String(firstRow[keyMapping.notes!] || ''),
                rentedVehicle: String(firstRow[keyMapping.rentedVehicle!] || ''),
                invoices: [],
                facturado: false,
                manualProgress: 0,
                startTime: '',
                endTime: '',
                vehicles: [],
            };

            rows.forEach(row => {
                const invoiceNumber = keyMapping.invoiceNumber ? String(row[keyMapping.invoiceNumber] || '') : '';
                const finalInvoiceDate = keyMapping.invoiceDate ? robustDateParse(row[keyMapping.invoiceDate]) : null;
                const invoiceAmount = keyMapping.netPrice ? (parseFloat(String(row[keyMapping.netPrice]).replace(/[$. ]/g, '').replace(',', '.')) || 0) : 0;

                if (invoiceNumber && finalInvoiceDate) {
                    orderData.invoices?.push({
                        id: crypto.randomUUID(),
                        number: invoiceNumber,
                        date: finalInvoiceDate,
                        amount: invoiceAmount,
                        billingMonth: String(row[keyMapping.billingMonth!] || ''),
                    });
                }
            });

            if(orderData.invoices && orderData.invoices.length > 0) {
              const totalInvoiced = orderData.invoices.reduce((sum, inv) => sum + inv.amount, 0);
              if (totalInvoiced >= (orderData.netPrice || 0) ) {
                orderData.facturado = true;
              }
            } else if (keyMapping.billingMonth && !!firstRow[keyMapping.billingMonth]) {
              orderData.facturado = true;
            }


            if (existingOtNumbers.has(orderData.ot_number)) {
                tempDuplicateOrders.push(orderData);
            } else {
                tempNewOrders.push(orderData);
            }
        });


        setErrors(validationErrors);
        setNewOrders(tempNewOrders);
        setDuplicateOrders(tempDuplicateOrders);
        
        if(validationErrors.length > 0) {
            setStep('selectFile');
        } else if (tempDuplicateOrders.length > 0) {
            setStep('confirmDuplicates');
        } else if (tempNewOrders.length > 0) {
            setStep('selectFile');
        } else {
            setStep('selectFile');
        }
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        setErrors(["Ocurrió un error inesperado al leer el archivo. Asegúrate de que el formato sea correcto."]);
        setStep('selectFile');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(fileToParse);
  };
  
  const handleImport = async (strategy: 'omit' | 'replace') => {
    const ordersToCreate = [...newOrders];
    let ordersToUpdate: {id: string, data: Partial<WorkOrder>}[] = [];

    if (strategy === 'replace') {
        duplicateOrders.forEach(dupOrder => {
            const existingOrder = workOrders.find(wo => String(wo.ot_number).trim() === String(dupOrder.ot_number).trim());
            if (existingOrder) {
                 const mergedData: Partial<WorkOrder> = {
                  ...dupOrder,
                  notes: [existingOrder.notes, dupOrder.notes].filter(Boolean).join('\n---\n'),
                };
                
                if (dupOrder.endDate === null) {
                    mergedData.endDate = '';
                }
                
                ordersToUpdate.push({ id: existingOrder.id, data: mergedData });
            }
        });
    }

    if (ordersToCreate.length === 0 && ordersToUpdate.length === 0) {
      toast({ variant: "destructive", title: "No hay datos para importar", description: "No se encontraron órdenes nuevas o para actualizar." });
      return;
    }

    setLoading(true);
    setStep('showResult');
    setImportResult(null);
    setImportProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    const batchErrors: string[] = [];
    const totalToProcess = ordersToCreate.length + ordersToUpdate.length;
    let processedCount = 0;

    for (const orderData of ordersToCreate) {
        try {
            await addOrder(orderData);
            successCount++;
        } catch (error: any) {
            errorCount++;
            batchErrors.push(`Creación OT ${orderData.ot_number}: ${error.message}`);
        }
        processedCount++;
        setImportProgress((processedCount / totalToProcess) * 100);
    }

    for (const { id, data } of ordersToUpdate) {
        try {
            await updateOrder(id, data);
            successCount++;
        } catch (error: any) {
            errorCount++;
            batchErrors.push(`Actualización OT ${data.ot_number}: ${error.message}`);
        }
        processedCount++;
        setImportProgress((processedCount / totalToProcess) * 100);
    }
    
    onImportSuccess();
    setImportResult({ successCount, errorCount, errors: batchErrors });
    setLoading(false);
  };

  const handleClose = () => {
    setFile(null);
    setNewOrders([]);
    setDuplicateOrders([]);
    setErrors([]);
    setImportResult(null);
    setLoading(false);
    setImportProgress(0);
    setStep('selectFile');
    onOpenChange(false);
  }

  const renderFileSelection = () => (
     <div className="space-y-4">
        <Button variant="outline" className="w-full" asChild>
            <a href="/Plantilla_Importacion_Inteligente.xlsx" download="Plantilla_Importacion_Inteligente.xlsx">
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla
            </a>
        </Button>
        <div className="relative">
            <input
                id="file-upload"
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".xlsx, .xls, .csv"
                disabled={loading}
            />
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                {loading ? (
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin mb-2"/>
                        <p>Analizando archivo...</p>
                    </div>
                ) : (
                    <>
                        <UploadCloud className="h-12 w-12 text-muted-foreground mb-2"/>
                        <p className="font-semibold text-primary">Haz clic para subir un archivo</p>
                        <p className="text-sm text-muted-foreground">o arrástralo y suéltalo aquí</p>
                    </>
                )}
            </label>
        </div>
        {file && newOrders.length === 0 && duplicateOrders.length === 0 && errors.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground pt-4">Archivo procesado. No se encontraron datos para importar.</p>
        )}
        {file && (newOrders.length > 0 || duplicateOrders.length > 0) && errors.length === 0 && !loading && (
          <div className="pt-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2"/>
            <h3 className="font-semibold">Archivo listo para importar</h3>
            <p className="text-sm text-muted-foreground">{newOrders.length} nuevas órdenes y {duplicateOrders.length} órdenes duplicadas encontradas.</p>
          </div>
        )}
    </div>
  );

  const renderConfirmDuplicates = () => (
    <div className="space-y-4">
        <div className="p-4 rounded-md bg-yellow-500/10 text-yellow-700">
            <div className="flex items-center gap-2 font-bold">
                <FileWarning className="h-5 w-5"/>
                <h3>Confirmación de Duplicados</h3>
            </div>
            <p className="text-sm mt-2">Se encontraron {duplicateOrders.length} OTs con números que ya existen en el sistema.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 border rounded-md">
                <p className="text-2xl font-bold">{newOrders.length}</p>
                <p className="text-sm text-muted-foreground">Órdenes Nuevas a Crear</p>
            </div>
            <div className="p-3 border rounded-md">
                <p className="text-2xl font-bold">{duplicateOrders.length}</p>
                <p className="text-sm text-muted-foreground">Órdenes a Actualizar</p>
            </div>
        </div>
        
        <p className="text-sm">Al reemplazar, se fusionará la información del Excel con los datos existentes en la app (como facturas añadidas manualmente), sin perderlos.</p>
        
        <div className="p-4 border rounded-md">
            <h4 className="font-semibold">Órdenes Duplicadas Encontradas:</h4>
             <ScrollArea className="h-24 mt-2">
                <ul className="text-xs list-disc pl-5">
                    {duplicateOrders.map((d, index) => <li key={`${d.ot_number}-${index}`}>{d.ot_number} - {d.description}</li>)}
                </ul>
            </ScrollArea>
        </div>
    </div>
  );

  const renderResult = () => (
     <div className="space-y-4">
        {loading ? (
            <div className="w-full flex flex-col items-center gap-2">
                <h3 className="font-semibold text-lg">Procesando Importación...</h3>
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">Procesando {Math.round((importProgress/100) * (newOrders.length + duplicateOrders.length))} de {newOrders.length + duplicateOrders.length}...</p>
            </div>
        ) : (
            <>
                <div className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold">Importación Completada</h3>
                </div>
                <p>Órdenes procesadas exitosamente: <span className="font-bold text-green-500">{importResult?.successCount}</span></p>
                <p>Órdenes con errores: <span className="font-bold text-destructive">{importResult?.errorCount}</span></p>
                {importResult && importResult.errors.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold">Detalles de errores:</h4>
                        <ScrollArea className="h-32 rounded-md border p-2">
                            <ul className="text-xs text-destructive list-disc list-inside">
                                {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </ScrollArea>
                    </div>
                )}
            </>
        )}
    </div>
  );
  
  const renderContent = () => {
    switch (step) {
      case 'selectFile':
        return renderFileSelection();
      case 'confirmDuplicates':
        return renderConfirmDuplicates();
      case 'showResult':
        return renderResult();
      default:
        return null;
    }
  }
  
  const renderFooter = () => {
    if (step === 'showResult' && loading) {
        return null; // No footer buttons while final progress is shown
    }

    switch (step) {
      case 'selectFile':
        return (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button onClick={() => handleImport('omit')} disabled={loading || !file || errors.length > 0 || (newOrders.length === 0 && duplicateOrders.length === 0)}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Importar {newOrders.length > 0 ? `${newOrders.length} Órdenes` : ''}
            </Button>
          </>
        )
      case 'confirmDuplicates':
        return (
          <>
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button variant="outline" onClick={() => handleImport('omit')} disabled={loading}>
                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Importar solo nuevas ({newOrders.length})
            </Button>
             <Button onClick={() => handleImport('replace')} disabled={loading}>
                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Reemplazar duplicados ({duplicateOrders.length})
            </Button>
          </>
        )
      case 'showResult':
        return <Button onClick={handleClose}>Cerrar</Button>
      default:
        return <Button variant="ghost" onClick={handleClose}>Cancelar</Button>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Órdenes de Trabajo</DialogTitle>
          <DialogDescription>
            {step === 'selectFile' && "Sube un archivo Excel para crear nuevas OTs masivamente."}
            {step === 'confirmDuplicates' && "Confirma cómo proceder con los datos duplicados."}
            {step === 'showResult' && "Resultados de la importación."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            {errors.length > 0 && (
                <div className="mb-4 p-4 rounded-md bg-destructive/10 text-destructive">
                    <h4 className="font-bold">Errores de Validación</h4>
                    <ScrollArea className="h-32 mt-2">
                        <ul className="text-xs list-disc pl-5">
                            {errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </ScrollArea>
                </div>
            )}
            {renderContent()}
        </div>

        <DialogFooter>
            {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
