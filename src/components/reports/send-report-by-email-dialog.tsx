
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
import type { SubmittedReport, AppUser, Collaborator, ReportTemplate, SmtpConfig } from '@/lib/types';
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
        ? report.submittedAt.toDate().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric'}) 
        : 'N/A';
    const shortFolio = report.id.substring(report.id.length - 6).toUpperCase();

    let fieldsHtml = '';
    template.fields.sort((a,b) => (a.id > b.id ? 1 : -1)).forEach(field => {
        const value = report.reportData[field.name];
        if (value !== undefined && value !== null && value !== '') {
             if (field.type === 'checkbox') {
                fieldsHtml += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${field.label}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">✔️</td></tr>`;
             } else {
                fieldsHtml += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${field.label}</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${String(value).replace(/\n/g, '<br>')}</td></tr>`;
             }
        }
    });

    const emailBody = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f4f4f4;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .header {
                background-color: #3CA7FA;
                color: #ffffff;
                padding: 24px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 24px;
            }
            .content p {
                line-height: 1.6;
            }
            .section-title {
                font-size: 18px;
                color: #3CA7FA;
                margin-top: 20px;
                margin-bottom: 10px;
                border-bottom: 2px solid #3CA7FA;
                padding-bottom: 5px;
            }
            .details-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            .details-table td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
            }
            .details-table td:first-child {
                font-weight: bold;
                width: 40%;
            }
            .footer {
                background-color: #f1f5f9;
                color: #64748b;
                padding: 20px;
                text-align: center;
                font-size: 12px;
            }
            .button {
                display: inline-block;
                background-color: #3CA7FA;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 5px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${template.name}</h1>
            </div>
            <div class="content">
                <p>Estimado Cliente,</p>
                <p>A continuación, encontrará el informe técnico correspondiente al servicio realizado. Agradeceríamos nos pudiera responder este correo con sus comentarios y la recepción conforme del servicio.</p>
                
                <h2 class="section-title">Información de la Orden de Trabajo</h2>
                <table class="details-table">
                    <tr><td>Nº OT</td><td>${report.otDetails.ot_number}</td></tr>
                    <tr><td>Cliente</td><td>${report.otDetails.client}</td></tr>
                    <tr><td>Descripción</td><td>${report.otDetails.description}</td></tr>
                    <tr><td>Folio Informe</td><td>${shortFolio}</td></tr>
                    <tr><td>Fecha Emisión</td><td>${submittedDate}</td></tr>
                </table>

                <h2 class="section-title">Detalles del Servicio Realizado</h2>
                <table class="details-table">
                   ${fieldsHtml}
                </table>

                <p>Para ver el informe completo en formato PDF, por favor haga clic en el siguiente botón:</p>
                <a href="#" class="button">Ver Informe Completo Online</a>
                
                <br><br>
                <p>Saludos cordiales,</p>
                <p><strong>El Equipo de ${companyInfo?.name || 'TechFlow'}</strong></p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${companyInfo?.name || 'TechFlow'}. Todos los derechos reservados.</p>
                <p>${companyInfo?.address || ''}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return emailBody;
  }

  const onSubmit = async (data: EmailFormValues) => {
    if (!report) return;
    
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
    
    const uniqueCcList = Array.from(new Set(ccList));
    
    const subject = `Informe de Servicio - OT ${report.otDetails.ot_number} - ${report.otDetails.client}`;
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
