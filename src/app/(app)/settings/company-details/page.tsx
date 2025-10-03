

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
import { Textarea } from '@/components/ui/textarea';
import type { CompanyInfo } from '@/lib/types';
import { Loader2, UploadCloud } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from 'next/image';

const companyFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  slogan: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyDetailsPage() {
  const { toast } = useToast();
  const { companyInfo, updateCompanyInfo, loading: contextLoading } = useWorkOrders();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: '',
      slogan: '',
      address: '',
      logoUrl: '',
    },
  });
  
  React.useEffect(() => {
    if (companyInfo) {
      form.reset(companyInfo);
      if (companyInfo.logoUrl) {
        setLogoPreview(companyInfo.logoUrl);
      }
    }
  }, [companyInfo, form]);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) { // 1MB limit
        toast({
          variant: "destructive",
          title: "Archivo demasiado grande",
          description: "Por favor, selecciona un logo de menos de 1MB.",
        });
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    let finalData = { ...data };

    try {
      if (logoFile) {
        const storageRef = ref(storage, `company_logos/${Date.now()}_${logoFile.name}`);
        const snapshot = await uploadBytes(storageRef, logoFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        finalData.logoUrl = downloadURL;
      }

      await updateCompanyInfo(finalData);

      toast({
          title: 'Datos de la Empresa Actualizados',
          description: 'La información de tu empresa ha sido guardada exitosamente.',
          duration: 2000,
      });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: error.message || "No se pudo actualizar la información de la empresa.",
        });
    } finally {
        setIsSubmitting(false);
    }
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
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
                <div className="md:col-span-1 space-y-2">
                    <FormLabel>Logo de la Empresa</FormLabel>
                    <div className="relative border-2 border-dashed border-muted rounded-lg p-4 h-48 flex items-center justify-center">
                        <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleLogoChange}
                        />
                        {logoPreview ? (
                            <Image src={logoPreview} alt="Vista previa del logo" fill objectFit="contain" className="rounded-md" />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <UploadCloud className="mx-auto h-10 w-10 mb-2"/>
                                <p className="text-sm">Arrastra o haz clic para subir</p>
                                <p className="text-xs">PNG, JPG, SVG (Máx 1MB)</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || contextLoading}>
                  {(isSubmitting || contextLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
