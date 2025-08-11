
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import type { Technician } from '@/lib/types';
import TechnicianForm, { type TechnicianFormValues } from '@/components/technicians/technician-form';

export default function EditTechnicianPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { technicians, updateTechnician } = useWorkOrders();
  const technicianId = params.id as string;
  
  const [technician, setTechnician] = React.useState<Technician | undefined>(undefined);

  React.useEffect(() => {
    const foundTechnician = technicians.find(t => t.id === technicianId);
    setTechnician(foundTechnician);
  }, [technicianId, technicians]);


  const handleSave = (data: TechnicianFormValues) => {
    if (!technician) return;
    updateTechnician(technician.id, { id: technician.id, ...data });
    toast({
      title: 'Técnico Actualizado',
      description: `El técnico "${data.name}" ha sido actualizado exitosamente.`,
      duration: 2000,
    });
    setTimeout(() => router.push('/technicians'), 2000);
  };
  
  if (!technician) {
    return <div>Cargando técnico...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Editar Técnico
        </h1>
        <p className="text-muted-foreground">
          Modifica los detalles del técnico.
        </p>
      </div>
      <TechnicianForm onSave={handleSave} technician={technician} />
    </div>
  );
}
