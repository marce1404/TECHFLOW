
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWorkOrders } from '@/context/work-orders-context';
import ReportTemplateForm from '@/components/settings/report-template-form';
import type { ReportTemplate } from '@/lib/types';

export default function EditReportTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { reportTemplates, updateReportTemplate } = useWorkOrders();
  
  const templateId = params.id as string;
  const template = React.useMemo(() => reportTemplates.find(t => t.id === templateId), [templateId, reportTemplates]);

  const handleSave = async (data: Omit<ReportTemplate, 'id'>) => {
    if (!template) return;
    await updateReportTemplate(template.id, data);
    toast({
      title: 'Plantilla Actualizada',
      description: `La plantilla "${data.name}" ha sido actualizada exitosamente.`,
      duration: 2000,
    });
    router.push('/settings/report-templates');
  };

  if (!template) {
    return <div>Cargando plantilla...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
          Editar Plantilla de Informe
        </h1>
        <p className="text-muted-foreground">
          Modifica los campos y detalles de la plantilla.
        </p>
      </div>
      <ReportTemplateForm onSave={handleSave} template={template} />
    </div>
  );
}
