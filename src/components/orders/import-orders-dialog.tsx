
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
import { Download, FileUp, Loader2, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import * as xlsx from 'xlsx';
import { z } from 'zod';
import type { CreateWorkOrderInput } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { useWorkOrders } from '@/context/work-orders-context';
import { normalizeString } from '@/lib/utils';

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

const workOrderStatuses = ['Por Iniciar', 'En Progreso', 'En Proceso', 'Pendiente', 'Atrasada', 'Cerrada', 'Terminada'] as const;
const workOrderPriorities = ['Baja', 'Media', 'Alta'] as const;

const CreateWorkOrderInputSchemaForExcel = z.object({
  'Numero OT': z.string().min(1, 'La columna "Numero OT" no puede estar vacía.').transform(val => val.replace(/-/g, '')),
  'Descripción': z.string().min(1, 'La columna "Descripción" no puede estar vacía.'),
  'Cliente': z.string().min(1, 'La columna "Cliente" no puede estar vacía.'),
  'Servicio': z.string().min(1, 'La columna "Servicio" no puede estar vacía.'),
  'Fecha Inicio': z.any().optional(),
  'Fecha Termino': z.any().optional(),
  'Notas': z.string().optional(),
  'Estado': z.string().transform((val) => {
    const normalized = normalizeString(val);
    if (normalized === 'en proceso') return 'En Progreso';
    if (normalized === 'terminada') return 'Cerrada';
    const foundStatus = workOrderStatuses.find(s => normalizeString(s) === normalized);
    return foundStatus || val;
  }),
  'Prioridad': z.string().optional().transform((val) => {
      if (!val) return 'Baja';
      const normalized = normalizeString(val);
      const foundPriority = workOrderPriorities.find(p => normalizeString(p) === normalized);
      return foundPriority || 'Baja';
  }),
  'Precio Neto': z.coerce.number().optional().default(0),
  'Nº Orden de Compra': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  'Encargados (nombres separados por coma)': z.string().optional(),
  'Técnicos (nombres separados por coma)': z.string().optional(),
  'Comercial': z.string().optional(),
  'RUT': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  'Nº Venta': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  'HES/EM/MIGO': z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  'Vehículo Arrendado': z.string().optional(),
  'Vehículos (patentes separadas por coma)': z.string().optional(),
  'Facturado': z.string().optional(),
});


export function ImportOrdersDialog({ open, onOpenChange, onImportSuccess }: ImportOrdersDialogProps) {
  const { collaborators, vehicles: availableVehicles, addOrder, services: availableServices, otStatuses } = useWorkOrders();
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedData, setParsedData] = React.useState<CreateWorkOrderInput[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [importResult, setImportResult] = React.useState<{ successCount: number; errorCount: number; errors: string[] } | null>(null);
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
      const validData: CreateWorkOrderInput[] = [];

      json.forEach((row: any, index: number) => {
        const rowData = { ...row };
        
        rowData['Fecha Inicio'] = parseDate(rowData['Fecha Inicio']);
        rowData['Fecha Termino'] = parseDate(rowData['Fecha Termino']);

        if (!rowData['Fecha Inicio']) {
            validationErrors.push(`Fila ${index + 2}: La columna 'Fecha Inicio' es requerida o tiene un formato inválido.`);
            return;
        }

        const result = CreateWorkOrderInputSchemaForExcel.safeParse(rowData);

        if (result.success) {
          const { 
              'Numero OT': ot_number,
              'Descripción': description,
              'Cliente': client,
              'RUT': rut,
              'Servicio': service,
              'Fecha Inicio': date,
              'Fecha Termino': endDate,
              'Estado': status,
              'Prioridad': priority,
              'Precio Neto': netPrice,
              'Nº Orden de Compra': ocNumber,
              'Encargados (nombres separados por coma)': assigned,
              'Técnicos (nombres separados por coma)': technicians,
              'Vehículos (patentes separadas por coma)': vehicles,
              'Comercial': comercial,
              'Nº Venta': saleNumber,
              'HES/EM/MIGO': hesEmMigo,
              'Vehículo Arrendado': rentedVehicle,
              'Notas': notes,
              'Facturado': facturado,
          } = result.data;
          
          const mappedAssigned = assigned 
            ? assigned.split(',').map(name => findMatchingCollaborator(name.trim()))
            : [];

          const mappedTechnicians = technicians 
            ? technicians.split(',').map(name => findMatchingCollaborator(name.trim()))
            : [];
            
          const mappedVehicles = vehicles
            ? vehicles.split(',').map(plate => findMatchingVehicle(plate.trim()))
            : [];

          const mappedComercial = comercial
            ? findMatchingCollaborator(comercial.trim())
            : '';

          validData.push({
            ot_number,
            description,
            client,
            rut,
            service: findMatchingString(service, availableServices),
            date: date,
            endDate: endDate,
            notes: notes,
            status: findMatchingString(status, otStatuses) as CreateWorkOrderInput['status'],
            priority: priority,
            netPrice: netPrice,
            ocNumber: ocNumber,
            assigned: mappedAssigned,
            technicians: mappedTechnicians,
            vehicles: mappedVehicles,
            comercial: mappedComercial,
            saleNumber: saleNumber,
            hesEmMigo: hesEmMigo,
            rentedVehicle: rentedVehicle,
            facturado: normalizeString(facturado || '') === 'si',
          });
        } else {
          const formattedErrors = result.error.issues.map(issue => `Fila ${index + 2}: Columna '${issue.path.join('.')}' - ${issue.message}`).join('; ');
          validationErrors.push(formattedErrors);
        }
      });

      setErrors(validationErrors);
      setParsedData(validData);
    };
    reader.readAsArrayBuffer(fileToParse);
  };
  
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({ variant: "destructive", title: "No hay datos para importar", description: "El archivo está vacío o no contiene filas válidas." });
      return;
    }
    setLoading(true);
    setImportResult(null);
    
    let successCount = 0;
    let errorCount = 0;
    const batchErrors: string[] = [];

    for (const orderData of parsedData) {
        try {
            await addOrder(orderData);
            successCount++;
        } catch (error: any) {
            errorCount++;
            batchErrors.push(`OT ${orderData.ot_number}: ${error.message}`);
        }
    }
    
    onImportSuccess();
    setImportResult({ successCount, errorCount, errors: batchErrors });
    setLoading(false);
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setImportResult(null);
    setLoading(false);
    onOpenChange(false);
  }

  const renderContent = () => {
    if (importResult) {
        return (
            <div className="space-y-4">
                <div className="text-center">
                    <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold">Importación Completada</h3>
                </div>
                <p>Órdenes creadas exitosamente: <span className="font-bold text-green-500">{importResult.successCount}</span></p>
                <p>Órdenes con errores: <span className="font-bold text-destructive">{importResult.errorCount}</span></p>
                {importResult.errors.length > 0 && (
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
        )
    }
    
    if (file) {
        return (
             <div className="space-y-4">
                <p>Archivo seleccionado: <span className="font-semibold">{file.name}</span></p>
                {errors.length > 0 ? (
                    <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-5 w-5"/>
                            <h4 className="font-bold">Se encontraron errores de validación.</h4>
                        </div>
                        <ScrollArea className="h-24">
                           <ul className="list-disc pl-5">
                            {errors.map((err, i) => <li key={i}>{err}</li>)}
                           </ul>
                        </ScrollArea>
                    </div>
                ) : (
                    <div className="p-4 rounded-md bg-green-500/10 text-green-700 text-sm">
                        <div className="flex items-center gap-2">
                             <CheckCircle className="h-5 w-5"/>
                             <h4 className="font-bold">El archivo parece correcto.</h4>
                        </div>
                    </div>
                )}
                <p>{parsedData.length} filas válidas listas para importar.</p>
                
                 <ScrollArea className="h-48 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nº OT</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Cliente</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.slice(0, 10).map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>{row.ot_number}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>{row.client}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">Mostrando hasta 10 filas de previsualización.</p>
            </div>
        )
    }

    return (
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
        </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Órdenes de Trabajo</DialogTitle>
          <DialogDescription>
            {importResult ? "Resultados de la importación." : "Sube un archivo Excel para crear nuevas OTs masivamente."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
            {renderContent()}
        </div>

        <DialogFooter>
            {importResult ? (
                <Button onClick={handleClose}>Cerrar</Button>
            ) : (
                <>
                    <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={loading || !file || errors.length > 0}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Importar {parsedData.length > 0 ? `${parsedData.length} Órdenes` : ''}
                    </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
