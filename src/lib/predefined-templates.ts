
import type { ReportTemplate } from './types';

export const predefinedReportTemplates: Omit<ReportTemplate, 'id'>[] = [
  {
    name: 'Guía de Atención Técnica',
    description: 'Formato estándar para registrar la atención técnica realizada a un cliente.',
    type: 'service-guide',
    fields: [
      // Section: Diagnóstico y Trabajo Realizado
      { id: 'field_1', name: 'service_date', label: 'Fecha de Servicio', type: 'date', required: true },
      { id: 'field_2', name: 'equipment_details', label: 'Equipo/Sistema Intervenido', type: 'text', required: false },
      { id: 'field_3', name: 'reported_fault', label: 'Falla Reportada por Cliente', type: 'textarea', required: true },
      { id: 'field_4', name: 'tech_diagnosis', label: 'Diagnóstico del Técnico', type: 'textarea', required: true },
      { id: 'field_5', name: 'work_done', label: 'Trabajo Realizado', type: 'textarea', required: true },
      { id: 'field_6', name: 'materials_used', label: 'Materiales y Repuestos Utilizados', type: 'textarea', required: false },
      { id: 'field_7', name: 'tech_recommendations', label: 'Recomendaciones y Observaciones', type: 'textarea', required: false },
      { id: 'field_8', name: 'system_operative', label: '¿Sistema queda operativo?', type: 'checkbox', required: false },
      
      // Section: Conformidad del Cliente
      { id: 'field_9', name: 'client_conformity', label: 'Cliente Conforme con el Servicio', type: 'checkbox', required: false },
      { id: 'field_10', name: 'client_observations', label: 'Observaciones del Cliente', type: 'textarea', required: false },
      { id: 'field_11', name: 'client_name_signature', label: 'Nombre de quien recibe', type: 'text', required: true },

      // Section: Técnico
      { id: 'field_12', name: 'technician_signature', label: 'Técnico Responsable', type: 'select', required: true, options: 'technicians' },
    ],
  },
];
