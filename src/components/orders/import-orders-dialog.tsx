
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

type ImportStep = 'selectFile' | 'showResult';

export function ImportOrdersDialog({ open, onOpenChange, onImportSuccess }: ImportOrdersDialogProps) {
  const { collaborators, addOrder, services: availableServices, otStatuses, workOrders, updateOrder } = useWorkOrders();
  const [file, setFile] = React.useState<File | null>(null);
  const [processedOrders, setProcessedOrders] = React.useState<(CreateWorkOrderInput & { isUpdate?: boolean, existingId?: string })[]>([]);
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
  
    const robustDateParse = (dateInput: any): string => {
        if (dateInput === null || dateInput === undefined || dateInput === '') return '';

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
            
            // Handle Spanish month names e.g., 'Enero', 'Febrero'
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
        
        return '';
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
    setProcessedOrders([]);

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
            ot_number: findHeader(['OT', 'Numero OT']),
            createdAt: findHeader(['Fecha Ingreso']),
            description: findHeader(['NOMBRE DEL PROYECTO', 'Descripción']),
            client: findHeader(['client', 'cliente']),
            rut: findHeader(['rut']),
            comercial: findHeader(['vendedor', 'Comercial']),
            assigned: findHeader(['SUPERV', 'Encargados (nombres separados por coma)']),
            technicians: findHeader(['tecnico', 'técnico', 'tecnicos', 'Técnicos (nombres separados por coma)']),
            service: findHeader(['SISTEMA', 'Servicio']),
            netPrice: findHeader(['MONTO NETO', 'Precio Neto']),
            status: findHeader(['FACTPROCES', 'Estado']),
            hesEmMigo: findHeader(['hes/em/migo', 'HES/EM/MIGO']),
            ocNumber: findHeader(['OC', 'Nº Orden de Compra']),
            saleNumber: findHeader(['nventa', 'Nº Venta']),
            invoiceNumber: findHeader(['Fact. N°']),
            invoiceDate: findHeader(['Fecha Fact.']),
            billingMonth: findHeader(['mesfac']),
            endDate: findHeader(['fechatermino', 'Fecha Termino']),
            rentedVehicle: findHeader(['vehiculoarrendado', 'Vehículo Arrendado']),
            notes: findHeader(['Notas']),
            priority: findHeader(['Prioridad']),
        };
        
        const validationErrors: string[] = [];
        const localProcessedOrders: (CreateWorkOrderInput & { isUpdate?: boolean, existingId?: string })[] = [];

        jsonData.forEach((row, index) => {
            const otNumberValue = keyMapping.ot_number ? row[keyMapping.ot_number] : undefined;
            const otNumber = otNumberValue ? String(otNumberValue).trim() : '';

            if (!otNumber) {
                // Skip rows without a valid OT number
                return;
            }
            
            const existingOrder = workOrders.find(wo => wo.ot_number === otNumber);
            const createdAtDate = keyMapping.createdAt ? robustDateParse(row[keyMapping.createdAt]) : (existingOrder?.createdAt || format(new Date(), 'yyyy-MM-dd'));
            
            const rawNetPrice = row[keyMapping.netPrice!] || 0;
            let finalNetPrice = 0;
            if (typeof rawNetPrice === 'number') {
                finalNetPrice = rawNetPrice;
            } else if (typeof rawNetPrice === 'string' && rawNetPrice.trim()) {
                const cleanedPrice = rawNetPrice.replace(/[$. ]/g, '').replace(',', '.');
                finalNetPrice = parseFloat(cleanedPrice) || 0;
            }

            const parseCollaborators = (key: 'assigned' | 'technicians' | 'comercial'): string[] | string => {
                const header = keyMapping[key];
                if (!header || !row[header]) return key === 'comercial' ? '' : [];
                const value = String(row[header]);
                const names = value.split(/[,;]/).map(name => findMatchingCollaborator(name.trim())).filter(Boolean);
                return key === 'comercial' ? names[0] || '' : names;
            };

            const orderData: CreateWorkOrderInput & { isUpdate?: boolean, existingId?: string } = {
                ot_number: otNumber,
                description: String(row[keyMapping.description!] || ''),
                client: String(row[keyMapping.client!] || ''),
                createdAt: createdAtDate,
                date: existingOrder ? '' : (robustDateParse(row[keyMapping.createdAt]) || ''),
                endDate: (keyMapping.endDate ? robustDateParse(row[keyMapping.endDate!]) : null) || '',
                service: keyMapping.service ? findMatchingString(String(row[keyMapping.service] || ''), availableServices) : '',
                status: keyMapping.status ? mapFactprocToStatus(String(row[keyMapping.status])) : 'Por Iniciar',
                priority: (row[keyMapping.priority!] || 'Baja') as WorkOrder['priority'],
                netPrice: finalNetPrice,
                assigned: parseCollaborators('assigned') as string[],
                technicians: parseCollaborators('technicians') as string[],
                comercial: parseCollaborators('comercial') as string,
                ocNumber: String(row[keyMapping.ocNumber!] || ''),
                rut: String(row[keyMapping.rut!] || ''),
                saleNumber: String(row[keyMapping.saleNumber!] || ''),
                hesEmMigo: String(row[keyMapping.hesEmMigo!] || ''),
                notes: String(row[keyMapping.notes!] || ''),
                rentedVehicle: String(row[keyMapping.rentedVehicle!] || ''),
                invoices: [],
                facturado: false,
                manualProgress: 0,
                startTime: '',
                endTime: '',
                vehicles: [],
                isUpdate: !!existingOrder,
                existingId: existingOrder?.id,
            };
            
            const invoiceNumber = keyMapping.invoiceNumber ? String(row[keyMapping.invoiceNumber] || '').trim() : '';
            const finalInvoiceDate = keyMapping.invoiceDate ? robustDateParse(row[keyMapping.invoiceDate]) : null;

            if (invoiceNumber && finalInvoiceDate) {
                const invoiceAmount = parseFloat(String(row[keyMapping.netPrice!]).replace(/[$. ]/g, '').replace(',', '.')) || 0;
                orderData.invoices?.push({
                    id: crypto.randomUUID(),
                    number: invoiceNumber,
                    date: finalInvoiceDate,
                    amount: invoiceAmount,
                    billingMonth: String(row[keyMapping.billingMonth!] || ''),
                });
            }

            if(!orderData.facturado) {
              const totalInvoiced = orderData.invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
              const netPrice = orderData.netPrice || 0;
              if (netPrice > 0 && totalInvoiced >= netPrice) {
                  orderData.facturado = true;
              } else if (keyMapping.billingMonth && row[keyMapping.billingMonth] && String(row[keyMapping.billingMonth]).trim() !== '') {
                  orderData.facturado = true;
              }
            }

            localProcessedOrders.push(orderData);
        });

        setErrors(validationErrors);
        setProcessedOrders(localProcessedOrders);
        
        if(validationErrors.length > 0) {
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
  
    const handleImport = async () => {
        let ordersToProcess = [...processedOrders];
        
        if (ordersToProcess.length === 0) {
        toast({ variant: "destructive", title: "No hay datos para importar", description: "No se encontraron órdenes para crear o actualizar." });
        return;
        }

        setLoading(true);
        setStep('showResult');
        setImportResult(null);
        setImportProgress(0);
        
        let successCount = 0;
        let errorCount = 0;
        const batchErrors: string[] = [];
        const totalToProcess = ordersToProcess.length;
        let processedCount = 0;

        const BATCH_SIZE = 50; 

        for (let i = 0; i < totalToProcess; i += BATCH_SIZE) {
            const batch = ordersToProcess.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (orderData) => {
                try {
                    if (orderData.isUpdate && orderData.existingId) {
                        const { isUpdate, existingId, ...updateData } = orderData;
                        await updateOrder(existingId, updateData);
                    } else {
                        await addOrder(orderData);
                    }
                    successCount++;
                } catch (error: any) {
                    errorCount++;
                    batchErrors.push(`Error en OT ${orderData.ot_number}: ${error.message}`);
                } finally {
                    processedCount++;
                }
            });

            await Promise.all(promises);
            setImportProgress((processedCount / totalToProcess) * 100);
            
            // Optional: pause between batches if needed to avoid hitting rate limits
            if (i + BATCH_SIZE < totalToProcess) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        onImportSuccess();
        setImportResult({ successCount, errorCount, errors: batchErrors });
        setLoading(false);
    };


  const handleClose = () => {
    setFile(null);
    setProcessedOrders([]);
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
        {file && processedOrders.length === 0 && errors.length === 0 && !loading && (
          <p className="text-center text-sm text-muted-foreground pt-4">Archivo procesado. No se encontraron datos para importar.</p>
        )}
        {file && processedOrders.length > 0 && errors.length === 0 && !loading && (
          <div className="pt-4 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2"/>
            <h3 className="font-semibold">Archivo listo para importar</h3>
            <p className="text-sm text-muted-foreground">{processedOrders.length} órdenes para crear/actualizar.</p>
          </div>
        )}
    </div>
  );

  const renderResult = () => (
     <div className="space-y-4">
        {loading ? (
            <div className="w-full flex flex-col items-center gap-2">
                <h3 className="font-semibold text-lg">Procesando Importación...</h3>
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">Procesando {Math.round((importProgress/100) * processedOrders.length)} de {processedOrders.length}...</p>
            </div>
        ) : (
            <>
                <div className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold">Importación Completada</h3>
                </div>
                <p>Órdenes creadas/actualizadas con éxito: <span className="font-bold text-green-500">{importResult?.successCount}</span></p>
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
            <Button onClick={() => handleImport()} disabled={loading || !file || errors.length > 0 || processedOrders.length === 0}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                Importar {processedOrders.length > 0 ? `${processedOrders.length} Órdenes` : ''}
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
            {step === 'selectFile' && "Sube un archivo Excel para crear nuevas OTs o actualizar existentes masivamente."}
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

    