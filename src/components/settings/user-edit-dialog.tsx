
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
import type { AppUser, UpdateUserInput } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { updateUserAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const editFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  role: z.enum(['Admin', 'Supervisor', 'Técnico', 'Visor']),
});

type EditFormValues = z.infer<typeof editFormSchema>;

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
}

export function UserEditDialog({ open, onOpenChange, user }: UserEditDialogProps) {
  const { toast } = useToast();
  const { fetchUsers } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: '',
      role: 'Visor',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.displayName,
        role: user.role,
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: EditFormValues) => {
    if (!user) return;
    setLoading(true);

    // If the logged-in user is editing themselves, update their client-side auth profile too.
    if (auth.currentUser && auth.currentUser.uid === user.uid && auth.currentUser.displayName !== data.name) {
        try {
            await updateProfile(auth.currentUser, { displayName: data.name });
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error al Actualizar Nombre',
                description: 'No se pudo actualizar el nombre en el perfil de autenticación.',
            });
            setLoading(false);
            return;
        }
    }

    const updateData: UpdateUserInput = {
        uid: user.uid,
        name: data.name,
        role: data.role,
    };

    const result = await updateUserAction(updateData);

    if (result.success) {
      toast({
        title: 'Usuario Actualizado',
        description: result.message,
      });
      await fetchUsers();
      onOpenChange(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al Actualizar',
        description: result.message,
      });
    }
    setLoading(false);
  };
  
  const userRoles: AppUser['role'][] = ['Admin', 'Supervisor', 'Técnico', 'Visor'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Modifica el nombre y el rol del usuario.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {userRoles.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                    Guardar Cambios
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
