
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { SmtpConfig } from '@/lib/types';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const smtpFormSchema = z.object({
  host: z.string().min(1, 'El servidor es requerido.'),
  port: z.coerce.number().min(1, 'El puerto es requerido.'),
  secure: z.enum(['none', 'ssl', 'starttls']),
  user: z.string().min(1, 'El usuario es requerido.'),
  pass: z.string().min(1, 'La contraseña es requerida.'),
  fromEmail: z.string().email('Debe ser un correo electrónico válido.'),
  fromName: z.string().min(1, 'El nombre del remitente es requerido.'),
});

type SmtpFormValues = z.infer<typeof smtpFormSchema>;

export function SmtpForm() {
  const { toast } = useToast();
  const { smtpConfig, updateSmtpConfig, loading } = useWorkOrders();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<SmtpFormValues>({
    resolver: zodResolver(smtpFormSchema),
    defaultValues: {
      host: '',
      port: 587,
      secure: 'starttls',
      user: '',
      pass: '',
      fromEmail: '',
      fromName: '',
    },
  });

  React.useEffect(() => {
    if (smtpConfig) {
      form.reset(smtpConfig);
    }
  }, [smtpConfig, form]);

  const onSubmit = async (data: SmtpFormValues) => {
    await updateSmtpConfig(data);
    toast({
      title: 'Configuración Guardada',
      description: 'La configuración del servidor de correo ha sido actualizada.',
      duration: 2000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuración de Correo (SMTP)</CardTitle>
        <CardDescription>
          Ingresa los datos de tu servidor de correo para habilitar el envío de informes y notificaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servidor SMTP</FormLabel>
                    <FormControl>
                      <Input placeholder="smtp.ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puerto</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="587" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seguridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">Ninguna</SelectItem>
                            <SelectItem value="ssl">SSL/TLS</SelectItem>
                            <SelectItem value="starttls">STARTTLS</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="fromEmail"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Correo del Remitente</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="reportes@miempresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="fromName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre del Remitente</FormLabel>
                        <FormControl>
                        <Input placeholder="Reportes TechFlow" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="user"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre de Usuario</FormLabel>
                        <FormControl>
                        <Input placeholder="El mismo correo o un usuario específico" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="pass"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <div className="relative">
                            <FormControl>
                                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••••" {...field} />
                            </FormControl>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
                                {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </button>
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Configuración
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
