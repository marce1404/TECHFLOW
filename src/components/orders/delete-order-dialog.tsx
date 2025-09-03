
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
import { useAuth } from '@/context/auth-context';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if(order) {
      setPassword('');
      setError('');
    }
  }, [order]);
  
  const handleConfirm = async () => {
    if (!order || !user || !user.email) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo obtener la información del usuario o de la orden." });
      return;
    }

    if (!password) {
      setError('La contraseña es requerida.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Re-authentication successful, now delete the order.
      await onConfirmDelete(order.id);

      toast({
        title: "Orden Eliminada",
        description: `La OT "${order.ot_number} - ${order.description}" ha sido eliminada.`,
        duration: 2000,
      });

      onClose();
      router.push('/orders');

    } catch (authError: any) {
      console.error("Re-authentication failed", authError);
      if (authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
        setError('Contraseña incorrecta. Inténtalo de nuevo.');
      } else {
        setError('Error de autenticación. No se pudo verificar tu identidad.');
      }
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
            Para confirmar la eliminación permanente de la OT <span className="font-bold">{order?.ot_number}</span>, por favor, ingresa tu contraseña.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input 
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Confirmar y Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
