
'use client';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { useWorkOrders } from '@/context/work-orders-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { ReportTemplate, SubmittedReport, WorkOrder } from '@/lib/types';
import Link from 'next/link';
import { FileWarning, CheckCircle2, Printer, File, User, Building, Loader2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function EditReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;
  
  const { reportTemplates, collaborators, submittedReports, updateSubmittedReport } = useWorkOrders();
  const { toast } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = React.useState<ReportTemplate | null>(null);
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const submittedReport = React.useMemo(() => {
    return submittedReports.find(r => r.id === reportId);
  }, [reportId, submittedReports]);


  const technicians = React.useMemo(() => {
    return collaborators.filter(c => c.role === 'Técnico' && c.status === 'Activo');
  }, [collaborators]);

  React.useEffect(() => {
      if (submittedReport) {
        const template = reportTemplates.find(t => t.id === submittedReport.templateId);
        setSelectedTemplate(template || null);
        setFormData(submittedReport.reportData || {});
      }
  }, [submittedReport, reportTemplates]);
  
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!submittedReport || !selectedTemplate) return;
      
      setIsSubmitting(true);

      const reportToUpdate: Partial<SubmittedReport> = {
          reportData: formData,
      };

      try {
        await updateSubmittedReport(submittedReport.id, reportToUpdate);
        toast({
          title: "Informe Actualizado",
          description: "Los cambios en el informe han sido guardados.",
          duration: 2000,
        });
        router.push('/reports/history');
      } catch (error) {
        console.error("Failed to update report: ", error);
        toast({
          variant: "destructive",
          title: "Error al Actualizar",
          description: "No se pudieron guardar los cambios en el informe.",
        });
      } finally {
        setIsSubmitting(false);
      }
  }

  if (!submittedReport) {
    return (
       <div className="flex flex-col items-center justify-center h-full gap-6">
            <Card className="w-full max-w-lg">
                <CardHeader className="items-center text-center">
                    <FileWarning className="h-16 w-16 text-destructive mb-4" />
                    <CardTitle className="text-2xl">Informe no Encontrado</CardTitle>
                    <CardDescription>
                       No se encontró el informe que intentas editar. Por favor, regresa y selecciona uno válido.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                     <Button asChild>
                        <Link href="/reports/history">Volver al Historial</Link>
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
                    <span className="font-semibold">{submittedReport.otDetails.ot_number}</span>
                </div>
                 <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 text-muted-foreground mt-1"/>
                    <div className="flex flex-col">
                        <span className="font-semibold">{submittedReport.otDetails.client}</span>
                        <span className="text-muted-foreground">{submittedReport.otDetails.description}</span>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground"/>
                    <span className="font-semibold">{submittedReport.otDetails.vendedor}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                    <span className="font-semibold">Valor del Servicio (Neto)</span>
                    <Badge variant="secondary">${new Intl.NumberFormat('es-CL').format(submittedReport.otDetails.netPrice)}</Badge>
                </div>
            </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
            <CardTitle>Editando Plantilla: {selectedTemplate?.name}</CardTitle>
            <CardDescription>
                {selectedTemplate?.description}
            </CardDescription>
            </CardHeader>
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
                        <Button variant="outline" type="button" asChild className="w-full sm:w-auto"><Link href="/reports/history">Cancelar</Link></Button>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Save className="mr-2 h-4 w-4" />
                          Guardar Cambios
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
      )}
    </div>
  );
}
