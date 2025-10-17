
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Paperclip, File as FileIcon, X } from 'lucide-react';
import { sendInvoiceRequestEmailAction } from '@/app/actions';
import { useWorkOrders } from '@/context/work-orders-context';
import type { WorkOrder } from '@/lib/types';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MultiSelect } from '../ui/multi-select';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const emailFormSchema = z.object({
  to: z.string().min(1, 'Debes seleccionar un destinatario.'),
  cc: z.array(z.string()).optional(),
  subject: z.string().min(1, 'El asunto es requerido.'),
  observations: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface SendToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: WorkOrder | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function SendToInvoiceDialog({ open, onOpenChange, order }: SendToInvoiceDialogProps) {
  const { toast } = useToast();
  const { smtpConfig, collaborators, updateOrder } = useWorkOrders();
  const { userProfile } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const canSend = smtpConfig !== null;

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: '',
      cc: [],
      subject: '',
      observations: '',
    },
  });
  
  const collaboratorOptions = React.useMemo(() => {
    return collaborators
        .filter(c => c.email)
        .map(c => ({ value: c.id, label: `${c.name} (${c.email})`}));
  }, [collaborators]);

  React.useEffect(() => {
    if (open && order) {
        const debora = collaborators.find(c => c.name.toLowerCase().includes('debora'));
        
        const comercialName = order.comercial;
        const assignedNames = order.assigned || [];

        const ccIds = new Set<string>();

        if (userProfile?.uid) {
            ccIds.add(userProfile.uid);
        }

        const comercial = collaborators.find(c => c.name === comercialName);
        if(comercial?.id) ccIds.add(comercial.id);

        assignedNames.forEach(name => {
            const assignedPerson = collaborators.find(c => c.name === name);
            if(assignedPerson?.id) ccIds.add(assignedPerson.id);
        });

        form.reset({
            to: debora?.id || '',
            cc: Array.from(ccIds),
            subject: `Solicitud de Facturación - ${order.ot_number} - ${order.description}`,
            observations: '',
        });
        setAttachments([]);
    }
  }, [order, open, form, collaborators, userProfile]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newAttachments = [...attachments];
      let hasError = false;

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          toast({ variant: 'destructive', title: 'Archivo demasiado grande', description: `El archivo "${file.name}" excede los 5MB.`});
          hasError = true;
          continue;
        }
        newAttachments.push(file);
      }
      if (!hasError) {
        setAttachments(newAttachments);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };


  const onSubmit = async (data: EmailFormValues) => {
    if (!order || !smtpConfig) {
        toast({
            variant: 'destructive',
            title: 'Error de Configuración',
            description: 'No se ha podido cargar la información de la OT o la configuración de correo.',
        });
        return;
    }
    
    setLoading(true);

    const toCollaborator = collaborators.find(c => c.id === data.to);
    if (!toCollaborator || !toCollaborator.email) {
        toast({ variant: 'destructive', title: 'Error', description: 'El destinatario seleccionado no tiene un correo válido.'});
        setLoading(false);
        return;
    }

    const ccEmails = (data.cc || [])
        .map(id => collaborators.find(c => c.id === id)?.email)
        .filter((email): email is string => !!email);
    
    const uniqueCcEmails = Array.from(new Set(ccEmails));
    
    const attachmentData: { filename: string; content: string }[] = [];
    for (const file of attachments) {
      const reader = new FileReader();
      const filePromise = new Promise<{ filename: string; content: string }>((resolve, reject) => {
        reader.onload = (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          if (base64) {
            resolve({ filename: file.name, content: base64 });
          } else {
            reject(new Error(`No se pudo leer el archivo ${file.name}`));
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
      attachmentData.push(await filePromise);
    }

    const serializableOrder = {
        ...order,
        invoices: order.invoices || []
    };

    const result = await sendInvoiceRequestEmailAction({
        to: toCollaborator.email,
        cc: uniqueCcEmails.join(','),
        subject: data.subject,
        observations: data.observations,
        attachments: attachmentData,
    }, serializableOrder, smtpConfig);

    if (result.success) {
      toast({
        title: 'Correo Enviado',
        description: 'La solicitud de facturación ha sido enviada.',
      });
      
      // Add the invoice request date to the work order
      const newRequestDate = new Date().toISOString();
      const updatedDates = [...(order.invoiceRequestDates || []), newRequestDate];
      await updateOrder(order.id, { invoiceRequestDates: updatedDates });

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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Solicitud de Facturación</DialogTitle>
          <DialogDescription>
            Se enviará un correo con los detalles de la OT <span className="font-bold">{order?.ot_number}</span> para que sea facturada.
            {order?.invoiceRequestDates && order.invoiceRequestDates.length > 0 && (
                <span className="text-xs text-muted-foreground block mt-2">
                    Último envío: {format(new Date(order.invoiceRequestDates[order.invoiceRequestDates.length - 1]), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Para</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar destinatario..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {collaborators.filter(c => c.email).map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CC (Opcional)</FormLabel>
                  <FormControl>
                     <MultiSelect
                        options={collaboratorOptions}
                        selected={field.value || []}
                        onChange={field.onChange}
                        placeholder="Añadir en copia a..."
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asunto</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones Adicionales</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej: Facturar el 50% del total..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Archivos Adjuntos</FormLabel>
              <p className="text-xs text-muted-foreground mb-2">Se recomienda adjuntar Orden de Compra (OC) y Nota de Venta (NV).</p>
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="mr-2 h-4 w-4" />
                Adjuntar Archivos
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={handleFileChange}
              />
               {attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2 truncate">
                            <FileIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{file.name}</span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeAttachment(index)}
                        >
                            <X className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!canSend && (
                <p className="text-sm text-destructive">La configuración SMTP no está establecida. Por favor, configúrela en los ajustes para poder enviar correos.</p>
            )}
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading || !canSend}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Solicitud
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
