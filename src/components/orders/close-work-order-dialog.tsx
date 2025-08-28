
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
import { Calendar } from '@/components/ui/calendar';
import type { WorkOrder } from '@/lib/types';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface CloseWorkOrderDialogProps {
  order: WorkOrder | null;
  onClose: () => void;
  onConfirm: (order: WorkOrder, closingDate: Date) => void;
}

export function CloseWorkOrderDialog({ order, onClose, onConfirm }: CloseWorkOrderDialogProps) {
  const [closingDate, setClosingDate] = React.useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleConfirm = () => {
    if (!order || !closingDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debe seleccionar una fecha de cierre.",
      });
      return;
    }
    onConfirm(order, closingDate);
  };
  
  // Reset date when dialog opens for a new order
  React.useEffect(() => {
    if(order) {
      setClosingDate(new Date());
    }
  }, [order]);

  return (
    <Dialog open={!!order} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Cierre de OT</DialogTitle>
          <DialogDescription>
            Selecciona la fecha de cierre para la orden de trabajo <span className="font-bold">{order?.ot_number}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex justify-center">
          <Calendar
            mode="single"
            selected={closingDate}
            onSelect={setClosingDate}
            locale={es}
            initialFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Cierre</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
