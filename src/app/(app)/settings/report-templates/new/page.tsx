
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import ReportTemplateForm from '@/components/settings/report-template-form';
import type { ReportTemplate } from '@/lib/types';

export default function NewReportTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addReportTemplate } = useWorkOrders();

  const handleSave = async (data: Omit<ReportTemplate, 'id'>) => {
    await addReportTemplate(data);
    toast({
      title: 'Plantilla Creada',
      description: `La plantilla "${data.name}" ha sido creada exitosamente.`,
      duration: 2000,
    });
    router.push('/settings/report-templates');
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Nueva Plantilla de Informe
        </h1>
        <p className="text-muted-foreground">
          Diseña un nuevo formato para los informes de servicio o guías de campo.
        </p>
      </div>
      <ReportTemplateForm onSave={handleSave} />
    </div>
  );
}
