
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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { changeUserPasswordAction } from '@/app/actions';

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' }),
  confirmPassword: z.string().min(6, { message: 'La confirmación debe tener al menos 6 caracteres.' }),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

interface UserChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
}

export function UserChangePasswordDialog({ open, onOpenChange, user }: UserChangePasswordDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);


  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
      setShowPassword(false);
    }
  }, [open, form]);

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    setLoading(true);

    const result = await changeUserPasswordAction(user.uid, data.newPassword);
    
    if (result.success) {
        toast({
            title: 'Contraseña Cambiada',
            description: `La contraseña para ${user.displayName} ha sido actualizada.`,
        });
        onOpenChange(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Error al Cambiar Contraseña',
            description: result.message,
        });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cambiar Contraseña</DialogTitle>
          <DialogDescription>
            Establecer una nueva contraseña para <span className="font-bold">{user?.displayName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva Contraseña</FormLabel>
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nueva Contraseña</FormLabel>
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
                    Guardar Nueva Contraseña
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
