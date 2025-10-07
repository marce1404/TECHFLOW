
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
  date: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  comercial: z.string().optional(),
  assigned: z.array(z.string()).optional(),
  netPrice: z.coerce.number().optional().default(0),
  facturado: z.boolean().optional(),
  ocNumber: z.string().optional(),
  hesEmMigo: z.string().optional(),
  saleNumber: z.string().optional(),
  invoiceNumber: z.union([z.string(), z.number()]).optional(),
  invoiceDate: z.string().optional(),
});


export function ImportOrdersDialog({ open, onOpenChange, onImportSuccess }: ImportOrdersDialogProps) {
  const { collaborators, addOrder, services: availableServices, otStatuses, workOrders, updateOrder, getNextOtNumber } = useWorkOrders();
  const [file, setFile] = React.useState<File | null>(null);
  const [newOrders, setNewOrders] = React.useState<CreateWorkOrderInput[]>([]);
  const [duplicateOrders, setDuplicateOrders] = React.useState<CreateWorkOrderInput[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
  const [step, setStep] = React.useState<ImportStep>('selectFile');
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

  const manualDateParse = (dateInput: string | number | Date): string | undefined => {
      if (!dateInput) return undefined;

      if (dateInput instanceof Date) {
          if (!isNaN(dateInput.getTime())) {
              return new Date(dateInput.getTime() - (dateInput.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          }
      }

      if (typeof dateInput === 'string') {
          const parts = dateInput.match(/(\d+)/g);
          if (parts && parts.length === 3) {
              const d = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10) - 1;
              let y = parseInt(parts[2], 10);
              if (y < 100) y += 2000;
              const date = new Date(y, m, d);
              if (!isNaN(date.getTime())) {
                  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
              }
          }
      }

      // Fallback for numeric Excel dates
      if (typeof dateInput === 'number' && dateInput > 0) {
          const date = new Date(Date.UTC(1899, 11, 30 + dateInput));
          if (!isNaN(date.getTime())) {
               return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
          }
      }

      return undefined;
  };
  
  const getColumnValue = (row: any, primaryKey: string, alternateKeys: string[] = []): any => {
    const keys = [primaryKey, ...alternateKeys];
    for (const key of keys) {
        const normalizedKey = normalizeString(key).replace(/\s+/g, '');
        for (const rowKey in row) {
            const normalizedRowKey = normalizeString(rowKey).replace(/\s+/g, '');
            if (normalizedRowKey === normalizedKey) {
                return row[rowKey];
            }
        }
    }
    return undefined;
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
        
        const jsonData: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "", raw: false });

        if (jsonData.length === 0) {
            setErrors(["El archivo está vacío o no tiene datos."]);
            setLoading(false);
            return;
        }

        const validationErrors: string[] = [];
        const tempNewOrders: CreateWorkOrderInput[] = [];
        const tempDuplicateOrders: CreateWorkOrderInput[] = [];

        const existingOtNumbers = new Set(workOrders.map(wo => wo.ot_number));

        jsonData.forEach((row: any, index: number) => {
            const get = (primary: string, alternates: string[] = []) => getColumnValue(row, primary, alternates);
            
            const rawNetPrice = get('MONTO NETO');
            let netPrice = 0;
            if (typeof rawNetPrice === 'number') {
                netPrice = rawNetPrice;
            } else if (typeof rawNetPrice === 'string') {
                const cleaned = rawNetPrice.replace(/[^0-9,.-]/g, '').replace(',', '.');
                netPrice = parseFloat(cleaned) || 0;
            }

            const mappedRow = {
                ot_number: String(get('OT', ['Numero OT'])),
                description: get('NOMBRE DEL PROYECTO', ['Descripción']),
                client: get('CLIENTE'),
                rut: get('RUT'),
                service: get('SISTEMA', ['Servicio']),
                date: get('Fecha Inicio Compromiso', ['Fecha Ingreso']),
                status: get('ESTADO'),
                comercial: get('VENDEDOR'),
                assigned: get('SUPERV.', ['Encargados (nombres separados por coma)']),
                netPrice,
                facturado: get('FACTURADO?'),
                ocNumber: get('OBSERVACION', ['Nº Orden de Compra']),
                hesEmMigo: get('EM-HES - MIGO'),
                saleNumber: get('NV', ['Nº Venta']),
                invoiceNumber: get('FACT. N°'),
                invoiceDate: get('Fecha')
            };

            const result = excelRowSchema.safeParse(mappedRow);
            
            if (result.success) {
                const { 
                    ot_number,
                    date: rawDate,
                    status: rawStatus,
                    facturado: rawFacturado,
                    comercial,
                    assigned: rawAssigned,
                    service,
                    invoiceNumber,
                    invoiceDate,
                    netPrice,
                    ...rest
                } = result.data;
                
                const finalDate = manualDateParse(rawDate);
                
                if (!finalDate) {
                    validationErrors.push(`Fila ${index + 2} (${ot_number || 'N/A'}): La fecha es requerida o inválida.`);
                    return;
                }

                const isFacturado = typeof rawFacturado === 'string' ? normalizeString(rawFacturado).includes('facturado') : !!rawFacturado;
                
                let status: WorkOrder['status'];
                if (isFacturado) {
                    status = 'Cerrada';
                } else {
                    const normalizedStatus = normalizeString(rawStatus || '');
                    if (normalizedStatus === 'terminado') status = 'Cerrada';
                    else if (normalizedStatus === 'en proceso') status = 'En Progreso';
                    else status = findMatchingString(rawStatus || '', otStatuses) as WorkOrder['status'] || 'Por Iniciar';
                }

                const mappedAssigned = Array.isArray(rawAssigned) ? rawAssigned.map(name => findMatchingCollaborator(name.trim())) : (rawAssigned ? String(rawAssigned).split(/[,;]/).map(name => findMatchingCollaborator(name.trim())) : []);

                const orderData: CreateWorkOrderInput = {
                    ot_number: ot_number.trim(),
                    date: finalDate,
                    status,
                    priority: 'Baja',
                    netPrice,
                    comercial: comercial ? findMatchingCollaborator(comercial.trim()) : '',
                    assigned: mappedAssigned,
                    service: findMatchingString(service || '', availableServices),
                    facturado: isFacturado,
                    invoices: [],
                    ...rest,
                };
                
                if (invoiceNumber) {
                    const finalInvoiceDate = manualDateParse(invoiceDate);
                    if (finalInvoiceDate) {
                        orderData.invoices?.push({
                            id: crypto.randomUUID(),
                            number: String(invoiceNumber),
                            date: finalInvoiceDate,
                            amount: netPrice || 0,
                        });
                    }
                }

                if (existingOtNumbers.has(ot_number.trim())) {
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
            const existingOrder = workOrders.find(wo => wo.ot_number === dupOrder.ot_number);
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
    
    let successCount = 0;
    let errorCount = 0;
    const batchErrors: string[] = [];

    for (const orderData of ordersToCreate) {
        try {
            await addOrder(orderData);
            successCount++;
        } catch (error: any) {
            errorCount++;
            batchErrors.push(`Creación OT ${orderData.ot_number}: ${error.message}`);
        }
    }

    for (const { id, data } of ordersToUpdate) {
        try {
            await updateOrder(id, data);
            successCount++;
        } catch (error: any) {
            errorCount++;
            batchErrors.push(`Actualización OT ${data.ot_number}: ${error.message}`);
        }
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
                    <Loader2 className="h-12 w-12 text-muted-foreground animate-spin"/>
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
