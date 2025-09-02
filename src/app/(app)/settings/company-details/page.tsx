
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as FormDesc } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CompanyInfo } from '@/lib/types';
import { Loader2 } from 'lucide-react';


const companyFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  slogan: z.string().optional(),
  address: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyDetailsPage() {
  const { toast } = useToast();
  const { companyInfo, updateCompanyInfo, loading, fetchData } = useWorkOrders();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      slogan: '',
      address: '',
    },
  });

  React.useEffect(() => {
    if (companyInfo) {
      form.reset(companyInfo);
    }
  }, [companyInfo, form]);
  
  const onSubmit = async (data: CompanyFormValues) => {
    await updateCompanyInfo(data);
    toast({
        title: 'Datos de la Empresa Actualizados',
        description: 'La información de tu empresa ha sido guardada exitosamente.',
        duration: 2000,
    });
    await fetchData(); // Re-fetch data to ensure UI is up to date
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la Empresa</CardTitle>
          <CardDescription>
            Esta información se mostrará en los documentos generados, como guías de servicio e informes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nombre de la Empresa</FormLabel>
                        <FormControl>
                        <Input placeholder="El nombre de tu empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="slogan"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Eslogan o Giro (Opcional)</FormLabel>
                        <FormControl>
                        <Input placeholder="Ej: Soluciones tecnológicas integrales" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Dirección (Opcional)</FormLabel>
                        <FormControl>
                        <Textarea placeholder="La dirección de tu empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    