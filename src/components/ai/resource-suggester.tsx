
'use client';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { getResourceSuggestions } from '@/app/actions';
import {
  availableTechniciansString,
  availableVehiclesString,
} from '@/lib/placeholder-data';
import { Loader2, Sparkles, Users, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SuggestOptimalResourceAssignmentOutputWithError } from '@/ai/flows/suggest-resource-assignment';

const formSchema = z.object({
  taskRequirements: z.string().min(10, 'Por favor, describe la tarea con más detalle.'),
  availableTechnicians: z.string().min(1, 'La lista de técnicos no puede estar vacía.'),
  availableVehicles: z.string().min(1, 'La lista de vehículos no puede estar vacía.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResourceSuggester() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestOptimalResourceAssignmentOutputWithError | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskRequirements: '',
      availableTechnicians: availableTechniciansString,
      availableVehicles: availableVehiclesString,
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setResult(null);

    const response = await getResourceSuggestions(data);

    if ('error' in response) {
      toast({
        variant: 'destructive',
        title: 'Error de IA',
        description: response.error,
      });
    } else {
      setResult(response);
    }

    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="taskRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requerimientos de la Tarea</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Se requiere instalar un sistema de aire acondicionado split en una oficina de 50m2. Se necesita experiencia en equipos de 12000 BTU, herramientas de corte y fijación."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableTechnicians"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Técnicos Disponibles</FormLabel>
                    <FormControl>
                      <Textarea rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableVehicles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehículos Disponibles</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Obtener Sugerencia
              </Button>
            </form>
          </Form>
        </div>
      
        <div className="space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground p-8 border rounded-lg h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Analizando recursos y generando sugerencia...</p>
              </div>
            )}
            {result && !loading && !('error' in result) && (
                <>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-2"><Users className="h-5 w-5"/>Técnicos Sugeridos</h3>
                        <p className="text-sm p-3 bg-secondary rounded-md">{result.suggestedTechnicians}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2 mb-2"><Truck className="h-5 w-5"/>Vehículos Sugeridos</h3>
                        <p className="text-sm p-3 bg-secondary rounded-md">{result.suggestedVehicles}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Justificación</h3>
                        <p className="text-sm text-muted-foreground p-3 border rounded-md">{result.justification}</p>
                    </div>
                </>
            )}
             {!result && !loading && (
                <div className="flex items-center justify-center h-full border rounded-lg">
                    <p className="text-sm text-muted-foreground">Las sugerencias aparecerán aquí.</p>
                </div>
            )}
        </div>
    </div>
  );
}
