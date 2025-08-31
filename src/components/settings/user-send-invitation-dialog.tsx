
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
import type { AppUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, Send } from 'lucide-react';
import { useWorkOrders } from '@/context/work-orders-context';
import { sendInvitationEmailAction } from '@/app/actions';

const invitationFormSchema = z.object({
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
});

type InvitationFormValues = z.infer<typeof invitationFormSchema>;

interface UserSendInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
}

export function UserSendInvitationDialog({ open, onOpenChange, user }: UserSendInvitationDialogProps) {
  const { toast } = useToast();
  const { smtpConfig } = useWorkOrders();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationFormSchema),
    defaultValues: {
      password: '',
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
      setShowPassword(false);
    }
  }, [open, form]);

  const onSubmit = async (data: InvitationFormValues) => {
    if (!user) return;
    setLoading(true);

    if (!smtpConfig) {
        toast({ variant: 'destructive', title: 'Error', description: 'La configuración SMTP no está establecida.'});
        setLoading(false);
        return;
    }
    
    const appUrl = window.location.origin + '/login';
    const result = await sendInvitationEmailAction(user, data.password, appUrl, smtpConfig);

    if (result.success) {
      toast({
        title: 'Invitación Enviada',
        description: `Se ha enviado un correo de invitación a ${user.email}.`,
      });
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al Enviar Invitación',
        description: result.message,
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enviar Invitación</DialogTitle>
          <DialogDescription>
            Introduce la contraseña para el usuario <span className="font-bold">{user?.displayName}</span> para incluirla en el correo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña del Usuario</FormLabel>
                   <div className="relative">
                        <FormControl>
                            <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                        </FormControl>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                    </div>
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
                    Enviar Invitación
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
