
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import type { Technician } from '@/lib/types';
import TechnicianForm, { type TechnicianFormValues } from '@/components/technicians/technician-form';

export default function NewTechnicianPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addTechnician, fetchData } = useWorkOrders();

  const handleSave = async (data: TechnicianFormValues) => {
    await addTechnician(data);
    toast({
      title: 'Técnico Creado',
      description: `El técnico "${data.name}" ha sido creado exitosamente.`,
      duration: 2000,
    });
    router.push('/technicians');
    // After pushing, fetch the data again to ensure the list is up-to-date.
    // A small delay can help ensure the navigation has completed.
    setTimeout(() => {
        fetchData();
    }, 100);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Nuevo Técnico
        </h1>
        <p className="text-muted-foreground">
          Completa los detalles para crear un nuevo técnico.
        </p>
      </div>
      <TechnicianForm onSave={handleSave} />
    </div>
  );
}
