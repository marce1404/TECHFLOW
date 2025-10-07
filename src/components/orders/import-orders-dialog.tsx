
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
import { Download, FileUp, Loader2, UploadCloud, CheckCircle, AlertCircle, FileWarning } from 'lucide-react';
import * as xlsx from 'xlsx';
import { z } from 'zod';
import type { CreateWorkOrderInput, WorkOrder } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { useWorkOrders } from '@/context/work-orders-context';
import { normalizeString } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

type ImportStep = 'selectFile' | 'confirmDuplicates' | 'showResult';

const workOrderStatuses = ['Por Iniciar', 'En Progreso', 'En Proceso', 'Pendiente', 'Atrasada', 'Cerrada', 'Terminada'] as const;
const workOrderPriorities = ['Baja', 'Media', 'Alta'] as const;

const CreateWorkOrderInputSchemaForExcel = z.object({
  'OT': z.union([z.string(), z.number()]).transform(val => String(val).trim()).refine(val => val.length > 0, 'La columna "OT" no puede estar vacía.'),
  'NOMBRE DEL PROYECTO': z.string().min(1, 'La columna "NOMBRE DEL PROYECTO" no puede estar vacía.'),
  'CLIENTE': z.string().min(1, 'La columna "CLIENTE" no puede estar vacía.'),
  'SISTEMA': z.string().min(1, 'La columna "SISTEMA" no puede estar vacía.'),
  'Fecha Ingreso': z.any().optional(),
  'OBSERVACION': z.string().optional().describe("Este campo contiene el N° de OC."),
  'ESTADO': z.string().transform((val) => {
    const normalized = normalizeString(val);
    if (normalized === 'terminado') return 'Cerrada';
    if (normalized === 'en proceso') return 'En Progreso';
    const foundStatus = workOrderStatuses.find(s => normalizeString(s) === normalized);
    return foundStatus || val;
  }),
  'VENDEDOR': z.string().optional(),
  'SUPERV.': z.string().optional(),
  'MONTO NETO': z.coerce.number().optional().default(0),
  'EM-HES-MIGO': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  'FACTURADO?': z.string().optional(),
});


export function ImportOrdersDialog({ open, onOpenChange, onImportSuccess }: ImportOrdersDialogProps) {
  const { collaborators, vehicles: availableVehicles, addOrder, services: availableServices, otStatuses, workOrders, updateOrder } = useWorkOrders();
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
  
  const findMatchingVehicle = (plate: string) => {
    if (!plate?.trim()) return plate;
    const normalizedPlate = normalizeString(plate);
    const found = availableVehicles.find(v => normalizeString(v.plate) === normalizedPlate);
    return found?.plate || plate;
  };

  const parseDate = (dateValue: any): string | undefined => {
    if (!dateValue) return undefined;

    if (dateValue instanceof Date) {
        const utcDate = new Date(Date.UTC(dateValue.getFullYear(), dateValue.getMonth(), dateValue.getDate()));
        return utcDate.toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'string') {
        const parts = dateValue.split(/[/.-]/);
        if (parts.length === 3) {
            let day, month, year;
            if (parts[2].length === 4) { // DD/MM/YYYY
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
            } else if (parts[0].length === 4) { // YYYY/MM/DD
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            }
            if (day && month && year && !isNaN(day) && !isNaN(month) && !isNaN(year)) {
                 const date = new Date(Date.UTC(year, month - 1, day));
                 if (!isNaN(date.getTime())) {
                     return date.toISOString().split('T')[0];
                 }
            }
        }
        const directParse = new Date(dateValue);
        if (!isNaN(directParse.getTime())) {
             const utcDate = new Date(Date.UTC(directParse.getFullYear(), directParse.getMonth(), directParse.getDate()));
             return utcDate.toISOString().split('T')[0];
        }
    }
    
    return undefined;
  }

  const parseFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = xlsx.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(worksheet, {raw: false});
      
      const validationErrors: string[] = [];
      const tempNewOrders: CreateWorkOrderInput[] = [];
      const tempDuplicateOrders: CreateWorkOrderInput[] = [];

      const existingOtNumbers = new Set(workOrders.map(wo => wo.ot_number));

      json.forEach((row: any, index: number) => {
        const rowData = { ...row };
        
        rowData['Fecha Ingreso'] = parseDate(rowData['Fecha Ingreso']);

        if (!rowData['Fecha Ingreso']) {
            validationErrors.push(`Fila ${index + 2}: La columna 'Fecha Ingreso' es requerida o tiene un formato inválido.`);
            return;
        }

        const result = CreateWorkOrderInputSchemaForExcel.safeParse(rowData);

        if (result.success) {
          const { 
              'OT': ot_number,
              'NOMBRE DEL PROYECTO': description,
              'CLIENTE': client,
              'SISTEMA': service,
              'Fecha Ingreso': date,
              'ESTADO': status,
              'VENDEDOR': comercial,
              'SUPERV.': assigned,
              'MONTO NETO': netPrice,
              'OBSERVACION': ocNumber,
              'EM-HES-MIGO': hesEmMigo,
              'FACTURADO?': facturado,
          } = result.data;
          
          const isFacturado = normalizeString(facturado || '').includes('facturado');

          const mappedAssigned = assigned 
            ? assigned.split(',').map(name => findMatchingCollaborator(name.trim()))
            : [];
            
          const orderData: CreateWorkOrderInput = {
            ot_number, description, client,
            service: findMatchingString(service, availableServices),
            date: date,
            status: isFacturado ? 'Cerrada' : (findMatchingString(status, otStatuses) as CreateWorkOrderInput['status']),
            priority: 'Baja', // Default priority
            netPrice: netPrice, 
            ocNumber: ocNumber,
            hesEmMigo: hesEmMigo,
            assigned: mappedAssigned,
            comercial: comercial ? findMatchingCollaborator(comercial.trim()) : '',
            facturado: isFacturado,
          };

          if (existingOtNumbers.has(ot_number)) {
              tempDuplicateOrders.push(orderData);
          } else {
              tempNewOrders.push(orderData);
          }

        } else {
          const formattedErrors = result.error.issues.map(issue => `Fila ${index + 2}: Columna '${issue.path.join('.')}' - ${issue.message}`).join('; ');
          validationErrors.push(formattedErrors);
        }
      });

      setErrors(validationErrors);
      setNewOrders(tempNewOrders);
      setDuplicateOrders(tempDuplicateOrders);
      
      if(validationErrors.length > 0) {
        setStep('selectFile'); // Stay on file selection to show errors
      } else if (tempDuplicateOrders.length > 0) {
        setStep('confirmDuplicates');
      } else {
        setStep('selectFile'); // Show preview even if no duplicates
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

    // Process creations
    for (const orderData of ordersToCreate) {
        try {
            await addOrder(orderData);
            successCount++;
        } catch (error: any) {
            errorCount++;
            batchErrors.push(`Creación OT ${orderData.ot_number}: ${error.message}`);
        }
    }

    // Process updates
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
            />
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                <UploadCloud className="h-12 w-12 text-muted-foreground mb-2"/>
                <p className="font-semibold text-primary">Haz clic para subir un archivo</p>
                <p className="text-sm text-muted-foreground">o arrástralo y suéltalo aquí</p>
            </label>
        </div>
        {file && errors.length === 0 && newOrders.length === 0 && duplicateOrders.length === 0 && <p>Archivo procesado. No se encontraron datos para importar.</p>}
        {file && newOrders.length > 0 && duplicateOrders.length === 0 && errors.length === 0 && (
          <div className="pt-4">
            <h3 className="font-semibold">Previsualización de Importación</h3>
            <p className="text-sm text-muted-foreground">{newOrders.length} nuevas órdenes de trabajo listas para importar.</p>
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
            <p className="text-sm mt-2">Se encontraron OTs con números que ya existen en el sistema.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 border rounded-md">
                <p className="text-2xl font-bold">{newOrders.length}</p>
                <p className="text-sm text-muted-foreground">Órdenes Nuevas</p>
            </div>
            <div className="p-3 border rounded-md">
                <p className="text-2xl font-bold">{duplicateOrders.length}</p>
                <p className="text-sm text-muted-foreground">Órdenes Duplicadas</p>
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
            {renderContent()}
        </div>

        <DialogFooter>
            {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
