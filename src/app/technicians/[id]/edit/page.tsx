
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import type { Technician } from '@/lib/types';
import TechnicianForm, { type TechnicianFormValues } from '@/components/technicians/technician-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Printer } from 'lucide-react';

export default function EditTechnicianPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { technicians, updateTechnician, fetchData } = useWorkOrders();
  const technicianId = params.id as string;
  
  const [technician, setTechnician] = React.useState<Technician | undefined>(undefined);

  React.useEffect(() => {
    const foundTechnician = technicians.find(t => t.id === technicianId);
    if (foundTechnician) {
      setTechnician(foundTechnician);
    } else {
      // If the technician is not found in the current state, it might be because
      // the state hasn't updated yet after creation. Fetch data again.
      fetchData();
    }
  }, [technicianId, technicians, fetchData]);


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
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-headline font-bold tracking-tight">
            Editar Técnico
          </h1>
          <p className="text-muted-foreground">
            Modifica los detalles del técnico.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/technicians/${technicianId}/print`} target="_blank">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Ficha
          </Link>
        </Button>
      </div>
      <TechnicianForm onSave={handleSave} technician={technician} />
    </div>
  );
}
