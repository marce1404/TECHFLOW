
'use client';
import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { inviteUserAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const inviteFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function UserInviteForm() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const { fetchUsers } = useAuth();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setLoading(true);
    const result = await inviteUserAction(data.email, data.name);
    if (result.success) {
      toast({
        title: 'Invitación Enviada',
        description: result.message,
      });
      form.reset();
      await fetchUsers();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al Invitar',
        description: result.message,
      });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitar Nuevo Usuario</CardTitle>
        <CardDescription>
          El nuevo usuario recibirá un correo para establecer su contraseña y se creará con el rol de "Visor" por defecto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="ejemplo@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4"/>}
                    Enviar Invitación
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
