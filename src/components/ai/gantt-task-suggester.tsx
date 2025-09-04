
'use client';
import * as React from 'react';
import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { suggestGanttTasks } from '@/ai/flows/suggest-gantt-tasks';
import type { SuggestGanttTasksOutput } from '@/ai/flows/suggest-gantt-tasks';
import { Loader2, Sparkles, Clipboard, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const formSchema = z.object({
  projectDescription: z.string().min(20, 'Por favor, describe el proyecto con más detalle para obtener mejores resultados.'),
});

type FormValues = z.infer<typeof formSchema>;

type GroupedTasks = {
    [key: string]: { taskName: string }[];
}

export default function GanttTaskSuggester() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestGanttTasksOutput | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectDescription: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setResult(null);

    try {
        const response = await suggestGanttTasks(data);
        setResult(response);
    } catch(error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error de IA',
            description: 'No se pudo generar la sugerencia. Por favor, inténtalo de nuevo.',
        });
    }

    setLoading(false);
  };
  
  const groupedTasks = React.useMemo(() => {
    if (!result?.tasks) return {};
    return result.tasks.reduce((acc, task) => {
        const { phase, taskName } = task;
        if (!acc[phase]) {
            acc[phase] = [];
        }
        acc[phase].push({ taskName });
        return acc;
    }, {} as GroupedTasks);
  }, [result]);

  const copyToClipboard = () => {
    if (!result?.tasks) return;

    const textToCopy = Object.entries(groupedTasks)
      .map(([phase, tasks]) => {
        const taskLines = tasks.map(t => `- ${t.taskName}`).join('\n');
        return `${phase}\n${taskLines}`;
      })
      .join('\n\n');

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      toast({ title: 'Copiado!', description: 'El plan de tareas se ha copiado al portapapeles.'});
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalles del Proyecto</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Instalar un sistema de control de acceso para 3 puertas en un edificio de oficinas, incluyendo lectoras de tarjeta, cerraduras electromagnéticas y software de gestión centralizado."
                        rows={8}
                        {...field}
                      />
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
                Generar Plan de Tareas
              </Button>
            </form>
          </Form>
        </div>
      
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Plan de Tareas Sugerido</h3>
                 {result && (
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                )}
            </div>
            {loading && (
              <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground p-8 border rounded-lg h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Analizando proyecto y generando tareas...</p>
              </div>
            )}
            {result && !loading && (
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Justificación de la IA</h4>
                        <p className="text-sm text-muted-foreground p-3 border rounded-md bg-secondary/50">{result.justification}</p>
                    </div>
                     <Accordion type="multiple" defaultValue={Object.keys(groupedTasks)} className="w-full">
                       {Object.entries(groupedTasks).map(([phase, tasks]) => (
                           <AccordionItem value={phase} key={phase}>
                               <AccordionTrigger className="text-base font-semibold">{phase}</AccordionTrigger>
                               <AccordionContent>
                                   <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                                    {tasks.map((task, index) => (
                                        <li key={index}>{task.taskName}</li>
                                    ))}
                                   </ul>
                               </AccordionContent>
                           </AccordionItem>
                       ))}
                    </Accordion>
                </div>
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
