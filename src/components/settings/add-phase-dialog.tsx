
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
import { useWorkOrders } from '@/context/work-orders-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const addPhaseFormSchema = z.object({
  phaseName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
});

type AddPhaseFormValues = z.infer<typeof addPhaseFormSchema>;

interface AddPhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
}

export function AddPhaseDialog({ open, onOpenChange, category }: AddPhaseDialogProps) {
  const { addSuggestedTask } = useWorkOrders();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<AddPhaseFormValues>({
    resolver: zodResolver(addPhaseFormSchema),
    defaultValues: {
      phaseName: '',
    },
  });

  React.useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: AddPhaseFormValues) => {
    setLoading(true);
    try {
      // To create a phase, we create a placeholder "task" that defines it.
      // This task won't be rendered but establishes the phase's existence and order.
      await addSuggestedTask({
        name: `__PHASE_PLACEHOLDER__${data.phaseName}`,
        category: category,
        phase: data.phaseName,
        order: Date.now(), // Use timestamp to place it at the end
        isPhasePlaceholder: true,
      });
      
      toast({
        title: 'Fase Creada',
        description: `La fase "${data.phaseName}" ha sido creada exitosamente.`,
      });
      onOpenChange(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error al Crear Fase',
        description: 'Ocurrió un error inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Fase</DialogTitle>
          <DialogDescription>
            Crea una nueva fase para la categoría <span className="font-bold capitalize">{category}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="phaseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Fase</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Fase de Cierre" {...field} />
                  </FormControl>
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
                    Crear Fase
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
