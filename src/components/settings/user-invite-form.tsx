

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
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { AppUser } from '@/lib/types';
import { useWorkOrders } from '@/context/work-orders-context';
import { createUserAction, sendInvitationEmailAction } from '@/app/actions';

const inviteFormSchema = z.object({
  name: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  confirmPassword: z.string().min(6, { message: 'La confirmación de contraseña debe tener al menos 6 caracteres.' }),
  role: z.enum(['Admin', 'Supervisor', 'Técnico', 'Visor'], { required_error: 'Debe seleccionar un rol.'}),
  sendInvitation: z.boolean().default(true),
}).refine(data => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

interface UserInviteFormProps {
    onUserAdded: () => void;
}

export function UserInviteForm({ onUserAdded }: UserInviteFormProps) {
  const { toast } = useToast();
  const { smtpConfig } = useWorkOrders();
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Visor',
      sendInvitation: true,
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    setLoading(true);

    try {
      const creationResult = await createUserAction({
        email: data.email,
        password: data.password,
        displayName: data.name,
        role: data.role,
      });

      if (!creationResult.success || !creationResult.user) {
        throw new Error(creationResult.message);
      }
      
      toast({
        title: 'Usuario Creado con Éxito',
        description: `El usuario ${data.name} ha sido creado.`,
      });
      
      onUserAdded();

      if (data.sendInvitation) {
        if (!smtpConfig) {
            toast({ variant: 'destructive', title: 'Advertencia', description: 'No se puede enviar la invitación. La configuración SMTP no está establecida.'});
        } else {
            const appUrl = window.location.origin;
             const result = await sendInvitationEmailAction(creationResult.user, data.password, appUrl, smtpConfig);
            if (result.success) {
                toast({ title: 'Invitación Enviada', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error al Enviar Invitación', description: result.message });
            }
        }
      }
      
      form.reset();
        
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al Crear Usuario',
        description: error.message || 'Ocurrió un error inesperado.',
      });
    } finally {
        setLoading(false);
    }
  };
  
  const userRoles: AppUser['role'][] = ['Admin', 'Supervisor', 'Técnico', 'Visor'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Usuario</CardTitle>
        <CardDescription>
          Completa los datos para crear un nuevo acceso al sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contraseña</FormLabel>
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
                    <FormLabel>Confirmar Contraseña</FormLabel>
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
            
             <FormField
                control={form.control}
                name="sendInvitation"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-start gap-2 pt-2">
                        <FormControl>
                            <Input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4" />
                        </FormControl>
                        <FormLabel>
                            Enviar correo de invitación con los datos de acceso
                        </FormLabel>
                    </FormItem>
                )}
            />

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
