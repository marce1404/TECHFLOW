
'use client';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { ReportTemplate, SubmittedReport } from '@/lib/types';
import Link from 'next/link';
import { FileWarning, CheckCircle2, Printer, File, User, Building, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function NewReportPage() {
  const searchParams = useSearchParams();
  const otNumber = searchParams.get('ot_number');
  
  const { activeWorkOrders, reportTemplates, collaborators, getOrder, addSubmittedReport } = useWorkOrders();
  
  const [selectedTemplate, setSelectedTemplate] = React.useState<ReportTemplate | null>(null);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedReportId, setSubmittedReportId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);


  const workOrder = React.useMemo(() => {
    if (!otNumber) return undefined;
    return getOrder(activeWorkOrders.find(o => o.ot_number === otNumber)?.id || '');
  }, [activeWorkOrders, otNumber, getOrder]);

  const technicians = React.useMemo(() => {
    return collaborators.filter(c => c.role === 'Técnico' && c.status === 'Activo');
  }, [collaborators]);

  const handleTemplateChange = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    
    const initialFormData: Record<string, any> = {};
    if (workOrder && template) {
        if(template.fields.some(f => f.name === 'service_date')) {
            initialFormData['service_date'] = new Date().toISOString().split('T')[0];
        }
        if(template.fields.some(f => f.name === 'requirement')) {
            initialFormData['requirement'] = workOrder.description;
        }
    }
    setFormData(initialFormData); 
  };
  
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!workOrder || !selectedTemplate) return;
      
      setIsSubmitting(true);

      const reportToSave: Omit<SubmittedReport, 'id' | 'submittedAt'> = {
          workOrderId: workOrder.id,
          templateId: selectedTemplate.id,
          reportData: formData,
          templateName: selectedTemplate.name,
          otDetails: {
            ot_number: workOrder.ot_number,
            client: workOrder.client,
            description: workOrder.description,
            netPrice: workOrder.netPrice,
            vendedor: workOrder.vendedor,
          }
      };

      try {
        const savedReport = await addSubmittedReport(reportToSave);
        setSubmittedReportId(savedReport.id);
        setIsSubmitted(true);
      } catch (error) {
        console.error("Failed to save report: ", error);
        // Optionally, show a toast error
      } finally {
        setIsSubmitting(false);
      }
  }
  
  const handlePrint = () => {
    if (submittedReportId) {
        window.open(`/reports/${submittedReportId}/print`, '_blank');
    } else {
        alert("No se pudo encontrar el ID del informe para imprimir.");
    }
  }

  const serviceGuides = reportTemplates.filter(t => t.type === 'service-guide');
  const projectDeliveries = reportTemplates.filter(t => t.type === 'project-delivery');

  if (isSubmitted) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-6">
            <Card className="w-full max-w-2xl">
                <CardHeader className="items-center text-center">
                     <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <CardTitle className="text-2xl">¡Informe Enviado!</CardTitle>
                    <CardDescription>
                        El informe para la OT <span className="font-bold">{workOrder?.ot_number}</span> ha sido guardado correctamente.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row justify-center gap-2">
                     <Button asChild className="w-full sm:w-auto">
                        <Link href="/reports">Crear Otro Informe</Link>
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
                        <Printer className="mr-2 h-4 w-4"/>
                        Imprimir
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!workOrder) {
    return (
       <div className="flex flex-col items-center justify-center h-full gap-6">
            <Card className="w-full max-w-lg">
                <CardHeader className="items-center text-center">
                    <FileWarning className="h-16 w-16 text-destructive mb-4" />
                    <CardTitle className="text-2xl">Orden de Trabajo no Válida</CardTitle>
                    <CardDescription>
                       No se encontró la orden de trabajo o no se especificó una. Por favor, regresa y selecciona una OT válida.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                     <Button asChild>
                        <Link href="/reports">Volver a la lista de OTs</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
            <CardHeader>
                <CardTitle>Información de OT</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-semibold">{workOrder.ot_number}</span>
                </div>
                 <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-muted-foreground mt-1"/>
                    <div className="flex flex-col">
                        <span className="font-semibold">{workOrder.client}</span>
                        <span className="text-muted-foreground">{workOrder.description}</span>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-semibold">{workOrder.vendedor}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="font-semibold">Valor del Servicio (Neto)</span>
                    <Badge variant="secondary">${new Intl.NumberFormat('es-CL').format(workOrder.netPrice)}</Badge>
                </div>
            </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
            <CardTitle>Seleccionar Plantilla</CardTitle>
            <CardDescription>
                Elige el formato de informe que deseas completar para la OT seleccionada.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                <div>
                <Label htmlFor="template-select">Seleccionar Plantilla</Label>
                <Select onValueChange={handleTemplateChange}>
                    <SelectTrigger id="template-select">
                    <SelectValue placeholder="Elige el formato a completar..." />
                    </SelectTrigger>
                    <SelectContent>
                        {serviceGuides.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Guías de Servicio</SelectLabel>
                                {serviceGuides.map(template => (
                                    <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                        {projectDeliveries.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Entrega de Proyectos</SelectLabel>
                                {projectDeliveries.map(template => (
                                    <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                    </SelectContent>
                </Select>
                </div>
            </div>
            </CardContent>
        </Card>
      </div>
      
      {selectedTemplate && (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {selectedTemplate.fields.sort((a,b) => (a.id > b.id ? 1 : -1)).map(field => {
                        const isCheckboxGroup = ['valor_pendiente', 'valor_cancelado', 'en_garantia', 'cargo_automatico'].includes(field.name);

                        if (isCheckboxGroup) return null;

                        return (
                        <div key={field.id}>
                            <Label htmlFor={field.name}>
                                {field.label} {field.required && <span className="text-destructive">*</span>}
                            </Label>
                            {field.type === 'text' && (
                                <Input id={field.name} required={field.required} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} />
                            )}
                            {field.type === 'textarea' && (
                                <Textarea id={field.name} required={field.required} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} />
                            )}
                            {field.type === 'number' && (
                                <Input id={field.name} type="number" required={field.required} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} />
                            )}
                            {field.type === 'date' && (
                                <Input id={field.name} type="date" required={field.required} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} />
                            )}
                             {field.type === 'checkbox' && (
                                <div className="flex items-center space-x-2 pt-2">
                                <Checkbox 
                                    id={field.name} 
                                    checked={!!formData[field.name]}
                                    onCheckedChange={(checked) => handleInputChange(field.name, checked)}
                                />
                                <label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {field.label}
                                </label>
                                </div>
                            )}
                            {field.type === 'select' && field.options === 'technicians' && (
                                <Select onValueChange={(value) => handleInputChange(field.name, value)} value={formData[field.name]}>
                                    <SelectTrigger id={field.name}>
                                        <SelectValue placeholder={`Seleccionar ${field.label}...`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {technicians.map(tech => (
                                            <SelectItem key={tech.id} value={tech.name}>
                                                {tech.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    )})}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedTemplate.fields.filter(f => ['valor_pendiente', 'valor_cancelado', 'en_garantia', 'cargo_automatico'].includes(f.name)).map(field => (
                            <div key={field.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={field.name} 
                                    checked={!!formData[field.name]}
                                    onCheckedChange={(checked) => handleInputChange(field.name, checked)}
                                />
                                <label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {field.label}
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                        <Button variant="outline" type="button" asChild className="w-full sm:w-auto"><Link href="/reports">Cancelar</Link></Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Guardar y Enviar Informe
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
      )}
    </div>
  );
}
