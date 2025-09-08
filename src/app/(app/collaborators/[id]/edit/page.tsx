
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import type { Collaborator } from '@/lib/types';
import CollaboratorForm, { type CollaboratorFormValues } from '@/components/collaborators/collaborator-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Printer, Trash2 } from 'lucide-react';
import AssignmentHistory from '@/components/shared/assignment-history';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/auth-context';
import { normalizeString } from '@/lib/utils';

export default function EditCollaboratorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { getCollaborator, updateCollaborator, loading, deleteCollaborator } = useWorkOrders();
  const { userProfile } = useAuth();
  const collaboratorId = params.id as string;
  
  const [collaborator, setCollaborator] = React.useState<Collaborator | undefined | null>(undefined);
  
  const canEdit = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

  React.useEffect(() => {
    if (!loading) {
      const foundCollaborator = getCollaborator(collaboratorId);
      setCollaborator(foundCollaborator);
    }
  }, [collaboratorId, loading, getCollaborator]);

  const handleSave = async (data: CollaboratorFormValues) => {
    if (!collaborator || !canEdit) return;
    const dataToSave = { ...collaborator, ...data };
    await updateCollaborator(collaborator.id, dataToSave);
    toast({
      title: 'Colaborador Actualizado',
      description: `El colaborador "${data.name}" ha sido actualizado exitosamente.`,
      duration: 2000,
    });
    router.push('/collaborators');
  };
  
  const handleDelete = async () => {
    if (!collaborator || !canEdit) return;
    await deleteCollaborator(collaborator.id);
    toast({
        title: "Colaborador Eliminado",
        description: `El colaborador "${collaborator.name}" ha sido eliminado.`,
        duration: 2000,
    });
    router.push('/collaborators');
  }

  const handlePrint = () => {
    window.open(`/collaborators/${collaboratorId}/print`, '_blank');
  };

  if (loading || collaborator === undefined) {
    return <div>Cargando colaborador...</div>;
  }
  
  if (collaborator === null) {
      return <div>Colaborador no encontrado.</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold tracking-tight">
            Editar Colaborador
          </h1>
          <p className="text-muted-foreground">
            {canEdit ? 'Modifica los detalles del colaborador.' : 'No tienes permisos para editar este colaborador.'}
          </p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Ficha
        </Button>
      </div>
      <CollaboratorForm onSave={handleSave} collaborator={collaborator} disabled={!canEdit} />

        {canEdit && (
             <div className="flex justify-between items-center mt-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!canEdit}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar Colaborador
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro de que desea eliminar a este colaborador?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción es permanente y no se puede deshacer. Se eliminará a "{collaborator.name}".
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                Sí, eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )}

      <AssignmentHistory 
        title="Historial de Asignaciones"
        description="Órdenes de trabajo asociadas a este colaborador."
        filterKey="supervisor" // or 'technician', the component handles both
        filterValue={collaborator.name}
      />
    </div>
  );
}
