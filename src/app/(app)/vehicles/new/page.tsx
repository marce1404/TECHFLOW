
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import VehicleForm, { type VehicleFormValues } from '@/components/vehicles/vehicle-form';
import { useAuth } from '@/context/auth-context';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewVehiclePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addVehicle, collaborators } = useWorkOrders();
  const { userProfile } = useAuth();
  
  const canCreate = userProfile?.role === 'Admin' || userProfile?.role === 'Supervisor';

  const handleSave = async (data: VehicleFormValues) => {
    if (!canCreate) return;
    await addVehicle(data);
    toast({
      title: 'Vehículo Creado',
      description: `El vehículo "${data.model}" ha sido creado exitosamente.`,
      duration: 1000,
    });
    setTimeout(() => router.push('/vehicles'), 1000);
  };
  
  if (!canCreate) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
                <CardDescription>No tienes permisos para crear nuevos vehículos.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Nuevo Vehículo
        </h1>
        <p className="text-muted-foreground">
          Completa los detalles para registrar un nuevo vehículo.
        </p>
      </div>
      <VehicleForm onSave={handleSave} collaborators={collaborators} />
    </div>
  );
}
