
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { AppUser } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

const inviteFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  role: z.enum(['Admin', 'Supervisor', 'Técnico', 'Visor'], { required_error: 'Debe seleccionar un rol.'}),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

export function UserInviteForm() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [lastPassword, setLastPassword] = React.useState<string | null>(null);
  const { fetchUsers } = useAuth();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'Visor',
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setLoading(true);
    setLastPassword(null);
    const result = await inviteUserAction(data);
    if (result.success) {
      toast({
        title: 'Usuario Creado',
        description: result.message,
      });
      if (result.tempPassword) {
        setLastPassword(result.tempPassword);
      }
      form.reset();
      await fetchUsers();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error al Crear Usuario',
        description: result.message,
      });
    }
    setLoading(false);
  };
  
  const userRoles: AppUser['role'][] = ['Admin', 'Supervisor', 'Técnico', 'Visor'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Usuario</CardTitle>
        <CardDescription>
          Completa los datos para crear un nuevo acceso al sistema. Se generará una contraseña temporal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                 <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Rol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
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
            </div>
            
            {lastPassword && (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>¡Usuario Creado!</AlertTitle>
                    <AlertDescription>
                        Copia y comparte esta contraseña temporal con el nuevo usuario: <strong className="font-mono">{lastPassword}</strong>
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4"/>}
                    Crear Usuario
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
