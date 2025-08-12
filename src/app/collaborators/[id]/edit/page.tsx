

'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import type { Collaborator } from '@/lib/types';
import CollaboratorForm, { type CollaboratorFormValues } from '@/components/collaborators/collaborator-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Printer } from 'lucide-react';

function EditCollaboratorComponent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { getCollaborator, updateCollaborator, loading } = useWorkOrders();
  const collaboratorId = params.id as string;
  
  const [collaborator, setCollaborator] = React.useState<Collaborator | undefined | null>(undefined);

  React.useEffect(() => {
    if (!loading) {
      const foundCollaborator = getCollaborator(collaboratorId);
      setCollaborator(foundCollaborator);
    }
  }, [collaboratorId, loading, getCollaborator]);


  const handleSave = (data: CollaboratorFormValues) => {
    if (!collaborator) return;
    updateCollaborator(collaborator.id, { id: collaborator.id, ...data });
    toast({
      title: 'Colaborador Actualizado',
      description: `El colaborador "${data.name}" ha sido actualizado exitosamente.`,
      duration: 2000,
    });
    setTimeout(() => router.push('/collaborators'), 2000);
  };
  
  if (collaborator === undefined) {
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
            Modifica los detalles del colaborador.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/collaborators/${collaboratorId}/print`} target="_blank" rel="noopener noreferrer">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Ficha
          </Link>
        </Button>
      </div>
      <CollaboratorForm onSave={handleSave} collaborator={collaborator} />
    </div>
  );
}

export default function EditCollaboratorPage() {
    return <EditCollaboratorComponent />;
}
