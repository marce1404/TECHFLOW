
import type { ReportTemplate } from './types';

export const predefinedReportTemplates: Omit<ReportTemplate, 'id'>[] = [
  {
    name: 'Guía de Atención Técnica',
    description: 'Formato estándar para registrar la atención técnica realizada a un cliente.',
    type: 'service-guide',
    fields: [
      { id: 'field_1', name: 'authorized_by', label: 'Autoriza Sr(a)', type: 'text', required: false },
      { id: 'field_2', name: 'central_type', label: 'Tipo de central', type: 'text', required: false },
      { id: 'field_3', name: 'start_date', label: 'Fecha de inicio', type: 'date', required: true },
      { id: 'field_4', name: 'end_date', label: 'Fecha de término', type: 'date', required: false },
      { id: 'field_5', name: 'requirement', label: 'Requerimiento', type: 'textarea', required: true },
      { id: 'field_6', name: 'solution', label: 'Solución', type: 'textarea', required: true },
      { id: 'field_7', name: 'technical_visit_cost', label: 'Valor visita técnica', type: 'number', required: false },
      { id: 'field_8', name: 'equipment_cost', label: 'Valor equipos', type: 'number', required: false },
      { id: 'field_9', name: 'total_cost', label: 'Total', type: 'number', required: false },
      { id: 'field_10', name: 'pending_payment', label: 'Valor pendiente', type: 'checkbox', required: false },
      { id: 'field_11', name: 'paid', label: 'Valor cancelado', type: 'checkbox', required: false },
      { id: 'field_12', name: 'warranty', label: 'En garantía', type: 'checkbox', required: false },
      { id: 'field_13', name: 'automatic_charge', label: 'Cargo Automático', type: 'checkbox', required: false },
      { id: 'field_14', name: 'invoice_number', label: 'Factura N°', type: 'text', required: false },
      { id: 'field_15', name: 'client_signature', label: 'Firma Cliente', type: 'text', required: false },
      { id: 'field_16', name: 'tech_signature', label: 'Firma Técnico', type: 'text', required: false },
    ],
  },
];
