
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import type { Vehicle } from '@/lib/types';
import VehicleForm, { type VehicleFormValues } from '@/components/vehicles/vehicle-form';
import AssignmentHistory from '@/components/shared/assignment-history';
import { Button } from '@/components/ui/button';
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
import { Trash2 } from 'lucide-react';

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { vehicles, collaborators, updateVehicle, deleteVehicle } = useWorkOrders();
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
  
  const handleDelete = async () => {
    if (!vehicle) return;
    await deleteVehicle(vehicle.id);
    toast({
        title: "Vehículo Eliminado",
        description: `El vehículo "${vehicle.model}" ha sido eliminado.`,
        duration: 2000,
    });
    router.push('/vehicles');
  }

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
          Modifica los detalles del vehículo y su historial de mantenimiento.
        </p>
      </div>
      <VehicleForm onSave={handleSave} vehicle={vehicle} collaborators={collaborators} />
        
        <div className="flex justify-between items-center mt-4">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Vehículo
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está seguro de que desea eliminar este vehículo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es permanente y no se puede deshacer. Se eliminará el vehículo "{vehicle.model} - {vehicle.plate}".
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

      <AssignmentHistory
        title="Historial de Asignaciones de OT"
        description="Órdenes de trabajo donde se ha utilizado este vehículo."
        filterKey="vehicle"
        filterValue={vehicle.plate}
       />
    </div>
  );
}
