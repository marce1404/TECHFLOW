
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
import { importOrdersFromExcel } from '@/app/actions';
import type { CreateWorkOrderInput } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { useWorkOrders } from '@/context/work-orders-context';
import { format } from 'date-fns';

interface ImportOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

const workOrderStatuses = ['Por Iniciar', 'En Progreso', 'En Proceso', 'Pendiente', 'Atrasada', 'Cerrada', 'CERRADA'] as const;
const workOrderPriorities = ['Baja', 'Media', 'Alta'] as const;

const CreateWorkOrderInputSchemaForExcel = z.object({
  ot_number: z.string().min(1, 'ot_number no puede estar vacío.'),
  description: z.string().min(1, 'description no puede estar vacío.'),
  client: z.string().min(1, 'client no puede estar vacío.'),
  service: z.string().min(1, 'service no puede estar vacío.'),
  date: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.preprocess((val) => {
    if (typeof val === 'string') {
        const lowerVal = val.toLowerCase();
        const foundStatus = workOrderStatuses.find(s => s.toLowerCase() === lowerVal);
        return foundStatus || val;
    }
    return val;
  }, z.enum(workOrderStatuses)),
  priority: z.preprocess((val) => {
      if (typeof val === 'string') {
          const lowerVal = val.toLowerCase();
          return lowerVal.charAt(0).toUpperCase() + lowerVal.slice(1);
      }
      return val;
  }, z.enum(workOrderPriorities)).optional(),
  netPrice: z.number().optional().default(0),
  ocNumber: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  invoiceNumber: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  assigned: z.string().optional(),
  technicians: z.string().optional(),
  comercial: z.string().optional(),
  rut: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  saleNumber: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  hesEmMigo: z.union([z.string(), z.number()]).optional().transform(val => val ? String(val) : undefined),
  rentedVehicle: z.string().optional(),
  vehicles: z.string().optional(),
});


export function ImportOrdersDialog({ open, onOpenChange, onImportSuccess }: ImportOrdersDialogProps) {
  const { collaborators, vehicles: availableVehicles } = useWorkOrders();
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
  
  const normalizeString = (str: string) => {
    return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };
  
  const findMatchingCollaborator = (name: string, role?: 'Técnico' | 'Supervisor' | 'Comercial' | 'Encargado') => {
    const normalizedName = normalizeString(name);
    const collaboratorPool = role 
        ? collaborators.filter(c => normalizeString(c.role) === normalizeString(role)) 
        : collaborators;
        
    const found = collaboratorPool.find(c => normalizeString(c.name) === normalizedName);
    return found?.name; // Return the correct, full name from the DB
  };
  
  const findMatchingVehicle = (plate: string) => {
    const normalizedPlate = normalizeString(plate);
    const found = availableVehicles.find(v => normalizeString(v.plate) === normalizedPlate);
    return found?.plate;
  };

  const parseDate = (dateValue: any): string | undefined => {
    if (!dateValue) return undefined;

    if (dateValue instanceof Date) {
        // Adjust for timezone offset when Excel provides a Date object
        const adjustedDate = new Date(dateValue.getTime() - (dateValue.getTimezoneOffset() * 60000));
        return adjustedDate.toISOString().split('T')[0];
    }
    
    if (typeof dateValue === 'string') {
        const parts = dateValue.split(/[/.-]/); // Handles DD/MM/YYYY, DD-MM-YYYY, etc.
        if (parts.length === 3) {
            let day, month, year;
            // Guess format based on part lengths or values
            if (parts[2].length === 4) { // Likely DD/MM/YYYY
                day = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                year = parseInt(parts[2], 10);
            } else if (parts[0].length === 4) { // Likely YYYY/MM/DD
                year = parseInt(parts[0], 10);
                month = parseInt(parts[1], 10);
                day = parseInt(parts[2], 10);
            }
             if (day && month && year && year > 1900) {
                 // Create date in UTC to avoid timezone issues
                const date = new Date(Date.UTC(year, month - 1, day));
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
        }
    }
    
    // Fallback for other formats like native YYYY-MM-DD or numbers
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
        const d = new Date(dateValue);
        if (!isNaN(d.getTime())) {
            const adjustedDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
            return adjustedDate.toISOString().split('T')[0];
        }
    }
    
    return undefined;
  }

  const parseFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = xlsx.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(worksheet);
      
      const validationErrors: string[] = [];
      const validData: CreateWorkOrderInput[] = [];

      json.forEach((row: any, index: number) => {
        const rowData = { ...row };
        
        rowData.date = parseDate(rowData.date);
        rowData.endDate = parseDate(rowData.endDate);

        if (!rowData.date) {
            validationErrors.push(`Fila ${index + 2}: La columna 'date' es requerida o tiene un formato inválido.`);
        }

        const result = CreateWorkOrderInputSchemaForExcel.safeParse(rowData);

        if (result.success) {
          const { assigned, technicians, vehicles, comercial, ...rest } = result.data;
          
          const mappedAssigned = assigned 
            ? assigned.split(',').map(name => findMatchingCollaborator(name.trim()) || name.trim())
            : [];

          const mappedTechnicians = technicians 
            ? technicians.split(',').map(name => findMatchingCollaborator(name.trim(), 'Técnico') || name.trim())
            : [];
            
          const mappedVehicles = vehicles
            ? vehicles.split(',').map(plate => findMatchingVehicle(plate.trim()) || plate.trim())
            : [];

          const mappedComercial = comercial
            ? findMatchingCollaborator(comercial.trim(), 'Comercial') || comercial.trim()
            : '';

          validData.push({
            ...rest,
            priority: rest.priority || 'Baja',
            assigned: mappedAssigned,
            technicians: mappedTechnicians,
            vehicles: mappedVehicles,
            comercial: mappedComercial,
          });
        } else {
          const formattedErrors = result.error.issues.map(issue => `Fila ${index + 2}: ${issue.path.join('.')} - ${issue.message}`).join('; ');
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

    const result = await importOrdersFromExcel(parsedData);
    setImportResult(result);
    setLoading(false);

    if (result.successCount > 0) {
        onImportSuccess();
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setImportResult(null);
    setLoading(false);
    onOpenChange(false);
  }

  const handleDownloadTemplate = () => {
    const templateData = [{
        ot_number: "OT-1000",
        description: "Ejemplo de descripción de la OT",
        client: "Nombre del Cliente",
        rut: "12.345.678-9",
        service: "CCTV",
        date: "16/06/2025",
        endDate: "20/06/2025",
        status: "Por Iniciar",
        priority: "Media",
        netPrice: 150000,
        ocNumber: "OC-12345",
        invoiceNumber: "F-6789",
        assigned: "Juan Pérez, María García",
        technicians: "Pedro Soto, Ana Torres",
        vehicles: "PPU-1111, PPU-2222",
        comercial: "Vendedor Ejemplo",
        saleNumber: 'VN-001',
        hesEmMigo: 'HES-9876',
        rentedVehicle: 'Hertz, PPU-RENT',
        notes: "Notas adicionales sobre el trabajo. Esto es un texto largo.",
    }];
    const worksheet = xlsx.utils.json_to_sheet(templateData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    xlsx.writeFile(workbook, "Plantilla_Importacion_OT.xlsx");
  };

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
            <Button variant="outline" className="w-full" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Descargar Plantilla de Ejemplo
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
      <DialogContent className="sm:max-w-xl">
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
