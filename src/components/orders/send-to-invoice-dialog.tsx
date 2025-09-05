
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
import { Loader2, Send } from 'lucide-react';
import { sendInvoiceRequestEmailAction } from '@/app/actions';
import { useWorkOrders } from '@/context/work-orders-context';
import type { WorkOrder } from '@/lib/types';
import { Textarea } from '../ui/textarea';

const emailFormSchema = z.object({
  to: z.string().email({ message: 'El correo del destinatario no es válido.' }),
  cc: z.string().optional(),
  subject: z.string().min(1, 'El asunto es requerido.'),
  observations: z.string().optional(),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface SendToInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: WorkOrder | null;
}

export function SendToInvoiceDialog({ open, onOpenChange, order }: SendToInvoiceDialogProps) {
  const { toast } = useToast();
  const { smtpConfig } = useWorkOrders();
  const [loading, setLoading] = React.useState(false);
  
  const canSend = smtpConfig !== null;

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: '',
      cc: '',
      subject: '',
      observations: '',
    },
  });

  React.useEffect(() => {
    if (order) {
      form.reset({
        to: 'facturacion@osesa.cl',
        cc: '',
        subject: `Solicitud de Facturación - OT ${order.ot_number} - ${order.client}`,
        observations: '',
      });
    }
  }, [order, form, open]);

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

    const result = await sendInvoiceRequestEmailAction(data, order, smtpConfig);

    if (result.success) {
      toast({
        title: 'Correo Enviado',
        description: 'La solicitud de facturación ha sido enviada.',
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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Solicitud de Facturación</DialogTitle>
          <DialogDescription>
            Se enviará un correo con los detalles de la OT <span className="font-bold">{order?.ot_number}</span> para que sea facturada.
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
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="cc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CC (Opcional, separar con comas)</FormLabel>
                  <FormControl><Input type="text" {...field} /></FormControl>
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
                    <Textarea placeholder="Ej: Facturar el 50% del total. Adjuntar HES." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
