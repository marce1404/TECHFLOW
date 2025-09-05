

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import CollaboratorForm, { type CollaboratorFormValues } from '@/components/collaborators/collaborator-form';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewCollaboratorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addCollaborator } = useWorkOrders();
  const { userProfile } = useAuth();
  
  const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

  const handleSave = async (data: CollaboratorFormValues) => {
    if (!canCreate) return;
    await addCollaborator(data);
    toast({
      title: 'Colaborador Creado',
      description: `El colaborador "${data.name}" ha sido creado exitosamente.`,
      duration: 2000,
    });
    router.push('/collaborators');
  };

  if (!canCreate) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
                <CardDescription>No tienes permisos para crear nuevos colaboradores.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Nuevo Colaborador
        </h1>
        <p className="text-muted-foreground">
          Completa los detalles para crear un nuevo colaborador.
        </p>
      </div>
      <CollaboratorForm onSave={handleSave} />
    </div>
  );
}
