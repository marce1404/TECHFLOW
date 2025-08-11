
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import VehicleForm, { type VehicleFormValues } from '@/components/vehicles/vehicle-form';

export default function NewVehiclePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addVehicle, technicians } = useWorkOrders();

  const handleSave = (data: VehicleFormValues) => {
    addVehicle(data);
    toast({
      title: 'Vehículo Creado',
      description: `El vehículo "${data.model}" ha sido creado exitosamente.`,
      duration: 2000,
    });
    setTimeout(() => router.push('/vehicles'), 2000);
  };

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
      <VehicleForm onSave={handleSave} technicians={technicians} />
    </div>
  );
}
