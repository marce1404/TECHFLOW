
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Download, FileUp, Loader2, UploadCloud, CheckCircle, FileWarning } from 'lucide-react';
import * as xlsx from 'xlsx';
import { z } from 'zod';
import type { CreateWorkOrderInput, WorkOrder } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { useWorkOrders } from '@/context/work-orders-context';
import { normalizeString } from '@/lib/utils';
import { format, parse, isValid } from 'date-fns';
import { Progress } from '../ui/progress';

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

type ImportStep = 'selectFile' | 'confirmDuplicates' | 'showResult';

const excelRowSchema = z.object({
  ot_number: z.string().min(1, "La columna OT es obligatoria."),
  description: z.string().optional(),
  client: z.string().optional(),
  rut: z.string().optional(),
  service: z.string().optional(),
  date: z.any().optional(),
  endDate: z.any().optional(),
  status: z.string().optional(),
  factproc: z.string().optional(),
  comercial: z.string().optional(),
  assigned: z.any().optional(),
  technicians: z.any().optional(),
  netPrice: z.any().optional(),
  facturado: z.any().optional(),
  notes: z.string().optional(),
  ocNumber: z.string().optional(),
  hesEmMigo: z.string().optional(),
  saleNumber: z.any().optional(),
  invoiceNumber: z.any().optional(),
  invoiceDate: z.any().optional(),
});


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
  
  const findMatchingCollaborator = (name: string) => {
    if (!name?.trim()) return name;
    const normalizedName = normalizeString(name).replace(/\./g, '');
    const found = collaborators.find(c => normalizeString(c.name).replace(/\./g, '').includes(normalizedName));
    return found?.name || name;
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
        if (!dateInput && dateInput !== 0) return null;

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
            if (dateInput.trim() === '2011-2023') return null;
            const formats = ['dd/MM/yyyy', 'd/M/yy', 'yyyy-MM-dd', 'd-M-yy', 'dd-MM-yyyy', 'MM/dd/yyyy'];
            for (const fmt of formats) {
                try {
                const parsedDate = parse(dateInput, fmt, new Date());
                if (isValid(parsedDate)) {
                    return format(parsedDate, 'yyyy-MM-dd');
                }
                } catch (e) {
                // ignore parse errors and try next format
                }
            }
        }
        return null;
    };


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
            .map(h => ({ original: String(h), normalized: normalizeString(String(h)).replace(/\s+/g, '') }));

        const findHeader = (variants: string[]) => {
            for (const variant of variants) {
                const normalizedVariant = normalizeString(variant).replace(/\s+/g, '');
                const header = headers.find(h => h.normalized === normalizedVariant);
                if (header) return header.original;
            }
            return null;
        };
        
        const keyMapping: { [key: string]: string | null } = {
            ot_number: findHeader(['ot', 'n ot']),
            date: findHeader(['fechaingreso', 'fecha ingreso']),
            description: findHeader(['nombredelproyecto', 'descripcion']),
            client: findHeader(['cliente']),
            rut: findHeader(['rut']),
            comercial: findHeader(['vendedor']),
            assigned: findHeader(['superv', 'encargado']),
            technicians: findHeader(['tecnico']),
            service: findHeader(['sistema', 'servicio']),
            netPrice: findHeader(['montoneto']),
            notes: findHeader(['observacion', 'estado']),
            factproc: findHeader(['factproc']),
            facturado: findHeader(['facturado']),
            hesEmMigo: findHeader(['em-hes-migo']),
            saleNumber: findHeader(['nv']),
            invoiceNumber: findHeader(['fact.n', 'factura']),
            invoiceDate: findHeader(['fechafact']),
            endDate: findHeader(['fechainiciocompromiso', 'fecha termino']),
        };


        const validationErrors: string[] = [];
        const tempNewOrders: CreateWorkOrderInput[] = [];
        const tempDuplicateOrders: CreateWorkOrderInput[] = [];

        const existingOtNumbers = new Set(workOrders.map(wo => String(wo.ot_number).trim()));

        jsonData.forEach((row, index) => {
            const mappedRow: { [key: string]: any } = {};
            for (const targetKey in keyMapping) {
                const excelKey = keyMapping[targetKey as keyof typeof keyMapping];
                if (excelKey && row[excelKey] !== undefined) {
                    mappedRow[targetKey] = row[excelKey];
                }
            }
            
            const rawDateValue = mappedRow.date;
            const finalDate = robustDateParse(rawDateValue);

            if (!finalDate) {
              const displayValue = rawDateValue instanceof Date ? rawDateValue.toISOString() : String(rawDateValue);
              validationErrors.push(`Fila ${index + 2} (${mappedRow.ot_number || 'N/A'}): La fecha de ingreso es requerida o inválida. Valor encontrado: '${displayValue || ''}'`);
              return;
            }
            
            mappedRow.date = finalDate;

            const result = excelRowSchema.safeParse(mappedRow);
            
            if (result.success) {
                const { 
                    endDate: rawEndDate,
                    factproc: rawFactproc,
                    facturado: rawFacturado,
                    comercial,
                    assigned: rawAssigned,
                    technicians: rawTechnicians,
                    service,
                    status: rawStatusLegacy,
                    notes: rawNotes,
                    invoiceNumber,
                    invoiceDate,
                    netPrice: rawNetPrice,
                    saleNumber: rawSaleNumber,
                    ...rest
                } = mappedRow;
                
                const finalEndDate = robustDateParse(rawEndDate);
                const isFacturado = typeof rawFacturado === 'string' ? normalizeString(rawFacturado).includes('facturado') : !!rawFacturado;

                let finalStatus: WorkOrder['status'] = 'Por Iniciar';
                const factprocStatus = normalizeString(rawFactproc || '');

                if (factprocStatus === 'facturado' || factprocStatus === 'terminada') {
                    finalStatus = 'Cerrada';
                } else if (factprocStatus === 'en proceso') {
                    finalStatus = 'En Progreso';
                } else if (factprocStatus === 'por iniciar') {
                    finalStatus = 'Por Iniciar';
                }
                
                const parseCollaborators = (names: any): string[] => {
                  if (!names) return [];
                  if(Array.isArray(names)) return names.map(name => findMatchingCollaborator(String(name).trim())).filter(Boolean);
                  return String(names).split(/[,;]/).map(name => findMatchingCollaborator(name.trim())).filter(Boolean);
                };
                
                let finalNetPrice = 0;
                if (typeof rawNetPrice === 'number') {
                    finalNetPrice = rawNetPrice;
                } else if (typeof rawNetPrice === 'string' && rawNetPrice.trim()) {
                    const cleanedPrice = rawNetPrice.replace(/[$. ]/g, '').replace(',', '.');
                    finalNetPrice = parseFloat(cleanedPrice) || 0;
                }
                
                const combinedNotes = [rawNotes, rawStatusLegacy].filter(Boolean).join(' - ');
                
                const otNumberString = String(rest.ot_number).trim();

                const orderData: CreateWorkOrderInput = {
                    ...rest,
                    ot_number: otNumberString,
                    endDate: finalEndDate || '',
                    status: finalStatus,
                    priority: 'Baja',
                    netPrice: finalNetPrice,
                    comercial: comercial ? findMatchingCollaborator(comercial.trim()) : '',
                    assigned: parseCollaborators(rawAssigned),
                    technicians: parseCollaborators(rawTechnicians),
                    service: findMatchingString(service || '', availableServices),
                    facturado: isFacturado,
                    invoices: [],
                    notes: combinedNotes,
                    saleNumber: rawSaleNumber ? String(rawSaleNumber) : undefined,
                };
                
                if (invoiceNumber) {
                    const finalInvoiceDate = robustDateParse(invoiceDate);
                    if (finalInvoiceDate) {
                        orderData.invoices?.push({
                            id: crypto.randomUUID(),
                            number: String(invoiceNumber),
                            date: finalInvoiceDate,
                            amount: finalNetPrice || 0,
                        });
                    }
                }

                if (existingOtNumbers.has(orderData.ot_number)) {
                    tempDuplicateOrders.push(orderData);
                } else {
                    tempNewOrders.push(orderData);
                }

            } else {
                const formattedErrors = result.error.issues.map(issue => `Fila ${index + 2}: Campo '${issue.path.join('.')}' - ${issue.message}`).join('; ');
                validationErrors.push(formattedErrors);
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
                ordersToUpdate.push({ id: existingOrder.id, data: dupOrder });
            }
        });
    }

    if (ordersToCreate.length === 0 && ordersToUpdate.length === 0) {
      toast({ variant: "destructive", title: "No hay datos para importar", description: "No se encontraron órdenes nuevas o para actualizar." });
      return;
    }

    setLoading(true);
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
    setStep('showResult');
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
        
        <p className="text-sm">Por favor, elige cómo manejar las órdenes duplicadas:</p>
        
        <div className="p-4 border rounded-md">
            <h4 className="font-semibold">Órdenes Duplicadas Encontradas:</h4>
             <ScrollArea className="h-24 mt-2">
                <ul className="text-xs list-disc pl-5">
                    {duplicateOrders.map(d => <li key={d.ot_number}>{d.ot_number} - {d.description}</li>)}
                </ul>
            </ScrollArea>
        </div>
    </div>
  );

  const renderResult = () => (
     <div className="space-y-4">
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
    if (loading && step !== 'selectFile') {
        return (
            <div className="w-full flex flex-col items-center gap-2">
                <Progress value={importProgress} className="w-full" />
                <p className="text-sm text-muted-foreground">Procesando {Math.round((importProgress/100) * (newOrders.length + duplicateOrders.length))} de {newOrders.length + duplicateOrders.length}...</p>
            </div>
        )
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
