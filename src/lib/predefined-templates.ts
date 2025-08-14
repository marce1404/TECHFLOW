
import type { ReportTemplate } from './types';

export const predefinedReportTemplates: Omit<ReportTemplate, 'id'>[] = [
  {
    name: 'Guía de Atención Técnica',
    description: 'Formato estándar para registrar la atención técnica realizada a un cliente.',
    type: 'service-guide',
    fields: [
      { id: 'field_1', name: 'service_date', label: 'Fecha de Servicio', type: 'date', required: true },
      { id: 'field_2', name: 'requirement', label: 'Requerimiento', type: 'textarea', required: true },
      { id: 'field_3', name: 'solution', label: 'Solución', type: 'textarea', required: true },
      { id: 'field_4', name: 'materials_used', label: 'Materiales y Repuestos Utilizados', type: 'textarea', required: false },
      { id: 'field_5', name: 'tech_recommendations', label: 'Recomendaciones y Observaciones', type: 'textarea', required: false },
      { id: 'field_6', name: 'system_operative', label: '¿Sistema queda operativo?', type: 'checkbox', required: false },
      { id: 'field_7', name: 'client_conformity', label: 'Cliente Conforme con el Servicio', type: 'checkbox', required: false },
      { id: 'field_8', name: 'client_observations', label: 'Observaciones del Cliente', type: 'textarea', required: false },
      { id: 'field_9', name: 'client_name_signature', label: 'Nombre de quien recibe', type: 'text', required: true },
      { id: 'field_10', name: 'technician_signature', label: 'Técnico Responsable', type: 'select', required: true, options: 'technicians' },
      { id: 'field_11', name: 'valor_pendiente', label: 'Valor pendiente', type: 'checkbox', required: false },
      { id: 'field_12', name: 'valor_cancelado', label: 'Valor cancelado', type: 'checkbox', required: false },
      { id: 'field_13', name: 'en_garantia', label: 'En garantía', type: 'checkbox', required: false },
      { id: 'field_14', name: 'cargo_automatico', label: 'Cargo Automático', type: 'checkbox', required: false },
    ],
  },
];
