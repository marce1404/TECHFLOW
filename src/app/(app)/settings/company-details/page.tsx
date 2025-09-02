
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
import { uploadLogoAction } from '@/app/actions';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';


const companyFormSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  slogan: z.string().optional(),
  address: z.string().optional(),
  logoUrl: z.string().url({ message: 'Debe ser una URL válida.' }).optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

export default function CompanyDetailsPage() {
  const { toast } = useToast();
  const { companyInfo, updateCompanyInfo, loading, fetchData } = useWorkOrders();
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);


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
    }
  }, [companyInfo, form]);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const result = await uploadLogoAction({
            fileBuffer: Buffer.from(arrayBuffer),
            fileType: file.type,
        }, (progress) => {
            setUploadProgress(progress);
        });

        if (result.success && result.url) {
            form.setValue('logoUrl', result.url, { shouldValidate: true });
            await onSubmit(form.getValues()); // Save form automatically after upload
            toast({ title: 'Logo Actualizado', description: 'El nuevo logo se ha subido y guardado.' });
        } else {
            toast({ variant: 'destructive', title: 'Error al Subir', description: result.message });
        }
        setIsUploading(false);
    };
  };

  const onSubmit = async (data: CompanyFormValues) => {
    await updateCompanyInfo(data);
    if (!isUploading) { // Avoid double toast if called after upload
        toast({
            title: 'Datos de la Empresa Actualizados',
            description: 'La información de tu empresa ha sido guardada exitosamente.',
            duration: 2000,
        });
    }
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
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                 <div className="space-y-2">
                    <FormLabel>Logo de la Empresa</FormLabel>
                    <Card className="aspect-video flex items-center justify-center bg-muted/50 p-4">
                       {form.watch('logoUrl') ? (
                           <Image src={form.watch('logoUrl')!} alt="Logo de la empresa" width={200} height={100} className="object-contain" />
                       ) : (
                           <p className="text-sm text-muted-foreground">No se ha subido un logo.</p>
                       )}
                    </Card>
                    {isUploading ? (
                        <Progress value={uploadProgress} className="w-full" />
                    ) : (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif"
                            />
                            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Subir Nuevo Logo
                            </Button>
                        </>
                    )}
                 </div>
               </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || isUploading}>
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
