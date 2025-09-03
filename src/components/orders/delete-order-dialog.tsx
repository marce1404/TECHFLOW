
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { WorkOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteOrderDialogProps {
  order: WorkOrder | null;
  onClose: () => void;
  onConfirmDelete: (orderId: string) => Promise<void>;
}

export function DeleteOrderDialog({ order, onClose, onConfirmDelete }: DeleteOrderDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirmationText, setConfirmationText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const CONFIRM_WORD = "ELIMINAR";

  React.useEffect(() => {
    if(order) {
      setConfirmationText('');
    }
  }, [order]);
  
  const handleConfirm = async () => {
    if (!order) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo obtener la información de la orden." });
      return;
    }

    if (confirmationText !== CONFIRM_WORD) {
       toast({ variant: "destructive", title: "Error", description: `Debes escribir "${CONFIRM_WORD}" para confirmar.` });
       return;
    }

    setLoading(true);

    try {
      await onConfirmDelete(order.id);

      toast({
        title: "Orden Eliminada",
        description: `La OT "${order.ot_number} - ${order.description}" ha sido eliminada.`,
        duration: 2000,
      });

      onClose();
      router.push('/orders');

    } catch (error: any) {
      console.error("Delete failed", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la orden." });
    } finally {
        setLoading(false);
    }
  };


  return (
    <Dialog open={!!order} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">Eliminar Orden de Trabajo</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Para confirmar la eliminación permanente de la OT <span className="font-bold">{order?.ot_number}</span>, por favor, escribe <span className="font-bold text-destructive">{CONFIRM_WORD}</span> en el campo de abajo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="confirmation">Confirmación</Label>
          <Input 
            id="confirmation"
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder={`Escribe "${CONFIRM_WORD}" para confirmar`}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={loading || confirmationText !== CONFIRM_WORD}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Confirmar y Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
