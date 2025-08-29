
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { SubmittedReport, AppUser, Collaborator, ReportTemplate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { sendReportEmailAction } from '@/app/actions';
import { MultiSelect } from '../ui/multi-select';
import { useWorkOrders } from '@/context/work-orders-context';
import { Timestamp } from 'firebase/firestore';

const emailFormSchema = z.object({
  to: z.string().email({ message: 'El correo del cliente no es válido.' }),
  ccManager: z.boolean().default(true),
  ccCurrentUser: z.boolean().default(true),
  ccCollaborators: z.array(z.string()).optional(),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface SendReportByEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: SubmittedReport | null;
  reportManager?: AppUser;
  currentUser?: AppUser;
}

export function SendReportByEmailDialog({ open, onOpenChange, report, reportManager, currentUser }: SendReportByEmailDialogProps) {
  const { toast } = useToast();
  const { collaborators, companyInfo, reportTemplates, smtpConfig } = useWorkOrders();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: '',
      ccManager: true,
      ccCurrentUser: true,
      ccCollaborators: [],
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const generateReportHtml = (report: SubmittedReport, template: ReportTemplate | undefined): string => {
    if (!template) return "<p>Error: Plantilla no encontrada.</p>";

    const submittedDate = report.submittedAt instanceof Timestamp 
        ? report.submittedAt.toDate().toLocaleDateString('es-CL') 
        : 'N/A';
    const shortFolio = report.id.substring(report.id.length - 6).toUpperCase();

    let fieldsHtml = '';
    template.fields.forEach(field => {
        const value = report.reportData[field.name];
        if (value !== undefined && value !== null && value !== '') {
             fieldsHtml += `<p><strong>${field.label}:</strong> ${String(value)}</p>`;
        }
    });

    const emailBody = `
        <p>Estimado Cliente,</p>
        <p>A continuación, encontrará el informe técnico correspondiente al servicio realizado.</p>
        <p>Agradeceríamos nos pudiera responder este correo con sus comentarios y la recepción conforme del servicio.</p>
        <br>
        <hr>
        <h1 style="font-family: sans-serif; color: #333;">${template.name} - Folio: ${shortFolio}</h1>
        <p>Fecha de Emisión: ${submittedDate}</p>
        <hr>
        <h2>Información de la OT</h2>
        <p><strong>Nº OT:</strong> ${report.otDetails.ot_number}</p>
        <p><strong>Cliente:</strong> ${report.otDetails.client}</p>
        <p><strong>Descripción:</strong> ${report.otDetails.description}</p>
        <hr>
        <h2>Detalles del Servicio</h2>
        ${fieldsHtml}
        <hr>
        <br>
        <p>Saludos cordiales,</p>
        <p><strong>El Equipo de ${companyInfo?.name || 'TechFlow'}</strong></p>
    `;

    return emailBody;
  }

  const onSubmit = async (data: EmailFormValues) => {
    if (!report) return;
    if (!smtpConfig) {
        toast({
            variant: 'destructive',
            title: 'Configuración Faltante',
            description: 'No se ha configurado el servidor de correo (SMTP). Por favor, ve a la configuración para añadirla.',
        });
        return;
    }
    setLoading(true);

    const template = reportTemplates.find(t => t.id === report.templateId);
    if (!template) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar la plantilla del informe.'});
        setLoading(false);
        return;
    }

    const ccList: string[] = [];
    if (data.ccManager && reportManager?.email) {
      ccList.push(reportManager.email);
    }
    if (data.ccCurrentUser && currentUser?.email) {
      ccList.push(currentUser.email);
    }
    if (data.ccCollaborators) {
      const collaboratorEmails = data.ccCollaborators
        .map(collaboratorId => collaborators.find(c => c.id === collaboratorId)?.email)
        .filter((email): email is string => !!email);
      ccList.push(...collaboratorEmails);
    }
    
    // Remove duplicates
    const uniqueCcList = Array.from(new Set(ccList));
    
    const subject = `Informe de Servicio - OT ${report.otDetails.ot_number}`;
    const htmlBody = generateReportHtml(report, template);

    const result = await sendReportEmailAction(data.to, uniqueCcList, subject, htmlBody, smtpConfig);

    if (result.success) {
      toast({
        title: 'Correo Enviado',
        description: result.message,
      });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al Enviar',
        description: result.message,
        duration: 8000,
      });
    }

    setLoading(false);
  };
  
  const collaboratorOptions = collaborators.map(c => ({ value: c.id, label: `${c.name} (${c.email})`})).filter(c => c.label.includes('@'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Informe por Correo</DialogTitle>
          <DialogDescription>
            Enviar el informe de la OT <span className="font-bold">{report?.otDetails.ot_number}</span> al cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para (Correo del Cliente)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
                <FormLabel>Copiar a (CC)</FormLabel>
                {reportManager && (
                    <FormField
                        control={form.control}
                        name="ccManager"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Encargado del Informe ({reportManager.displayName})</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                )}
                 {currentUser && (
                    <FormField
                        control={form.control}
                        name="ccCurrentUser"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>Mi Correo ({currentUser.email})</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="ccCollaborators"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Otros Colaboradores</FormLabel>
                        <MultiSelect
                          options={collaboratorOptions}
                          selected={field.value || []}
                          onChange={field.onChange}
                          placeholder="Seleccionar colaboradores..."
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Correo
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
