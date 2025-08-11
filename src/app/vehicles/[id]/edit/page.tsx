
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import type { Vehicle } from '@/lib/types';
import VehicleForm, { type VehicleFormValues } from '@/components/vehicles/vehicle-form';

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { vehicles, technicians, updateVehicle } = useWorkOrders();
  const vehicleId = params.id as string;
  
  const [vehicle, setVehicle] = React.useState<Vehicle | undefined>(undefined);

  React.useEffect(() => {
    const foundVehicle = vehicles.find(t => t.id === vehicleId);
    setVehicle(foundVehicle);
  }, [vehicleId, vehicles]);


  const handleSave = (data: VehicleFormValues) => {
    if (!vehicle) return;
    updateVehicle(vehicle.id, { id: vehicle.id, ...data });
    toast({
      title: 'Vehículo Actualizado',
      description: `El vehículo "${data.model}" ha sido actualizado exitosamente.`,
      duration: 2000,
    });
    setTimeout(() => router.push('/vehicles'), 2000);
  };
  
  if (!vehicle) {
    return <div>Cargando vehículo...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Editar Vehículo
        </h1>
        <p className="text-muted-foreground">
          Modifica los detalles del vehículo.
        </p>
      </div>
      <VehicleForm onSave={handleSave} vehicle={vehicle} technicians={technicians} />
    </div>
  );
}
