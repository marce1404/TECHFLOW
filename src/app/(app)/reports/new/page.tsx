

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
import type { ReportTemplate } from '@/lib/types';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileWarning, CheckCircle2 } from 'lucide-react';

export default function NewReportPage() {
  const searchParams = useSearchParams();
  const otNumber = searchParams.get('ot_number');
  
  const { activeWorkOrders, reportTemplates, collaborators } = useWorkOrders();
  
  const [selectedTemplate, setSelectedTemplate] = React.useState<ReportTemplate | null>(null);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = React.useState(false);


  const workOrder = React.useMemo(() => {
    return activeWorkOrders.find(o => o.ot_number === otNumber);
  }, [activeWorkOrders, otNumber]);

  const technicians = React.useMemo(() => {
    return collaborators.filter(c => c.role === 'Técnico' && c.status === 'Activo');
  }, [collaborators]);

  const handleTemplateChange = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setFormData({}); // Reset form data when template changes
  };
  
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Here you would typically save the formData to your database,
      // associated with the workOrder.id
      console.log({
          workOrderId: workOrder?.id,
          templateId: selectedTemplate?.id,
          reportData: formData,
      });
      setIsSubmitted(true);
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
                <CardContent className="flex justify-center">
                     <Button asChild>
                        <Link href="/reports">Volver a la lista</Link>
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
      <Card>
        <CardHeader>
          <CardTitle>Completar Informe para OT: {workOrder.ot_number}</CardTitle>
          <CardDescription>
            {workOrder.description} - {workOrder.client}
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
      
      {selectedTemplate && (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {selectedTemplate.fields.sort((a,b) => (a.name > b.name ? 1 : -1)).map(field => (
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
                    ))}
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" asChild><Link href="/reports">Cancelar</Link></Button>
                        <Button type="submit">Guardar y Enviar Informe</Button>
                    </div>
                </CardContent>
            </Card>
        </form>
      )}
    </div>
  );
}
