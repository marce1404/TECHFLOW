
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
import type { SmtpConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { sendTestEmailAction } from '@/app/actions';
import { useAuth } from '@/context/auth-context';

const testEmailFormSchema = z.object({
  email: z.string().email({ message: 'Debe ser un correo electrónico válido.' }),
});

type TestEmailFormValues = z.infer<typeof testEmailFormSchema>;

interface UserSendTestEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SmtpConfig;
}

export function UserSendTestEmailDialog({ open, onOpenChange, config }: UserSendTestEmailDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<TestEmailFormValues>({
    resolver: zodResolver(testEmailFormSchema),
    defaultValues: {
      email: '',
    },
  });

  React.useEffect(() => {
    if (open && user?.email) {
      form.setValue('email', user.email);
    }
  }, [open, user, form]);

  const onSubmit = async (data: TestEmailFormValues) => {
    setLoading(true);
    const result = await sendTestEmailAction(config, data.email);
    
    if (result.success) {
        toast({
            title: 'Éxito',
            description: result.message,
        });
        onOpenChange(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error en la Prueba',
            description: result.message,
            duration: 8000,
        });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Correo de Prueba</DialogTitle>
          <DialogDescription>
            Confirma la dirección de correo a la que se enviará el mensaje de prueba.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enviar a</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
