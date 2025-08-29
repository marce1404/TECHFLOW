
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
      { id: 'field_15', name: 'client_rut_signature', label: 'RUT de quien recibe', type: 'text', required: false },
      { id: 'field_10', name: 'technician_signature', label: 'Técnico Responsable', type: 'select', required: true, options: 'technicians' },
      { id: 'field_11', name: 'valor_pendiente', label: 'Valor pendiente', type: 'checkbox', required: false },
      { id: 'field_12', name: 'valor_cancelado', label: 'Valor cancelado', type: 'checkbox', required: false },
      { id: 'field_13', name: 'en_garantia', label: 'En garantía', type: 'checkbox', required: false },
      { id: 'field_14', name: 'cargo_automatico', label: 'Cargo Automático', type: 'checkbox', required: false },
    ],
  },
  {
    name: 'Acta de Entrega de Proyecto',
    description: 'Formato para la entrega formal de un proyecto, validando alcance y conformidad.',
    type: 'project-delivery',
    fields: [
      { id: 'p_field_1', name: 'project_summary', label: 'Resumen del Proyecto y Sistema Instalado', type: 'textarea', required: true },
      { id: 'p_field_2', name: 'scope_agreed', label: 'Alcance contractual cumplido', type: 'checkbox', required: true },
      { id: 'p_field_3', name: 'system_functional_test', label: 'Pruebas funcionales del sistema realizadas', type: 'checkbox', required: true },
      { id: 'p_field_4', name: 'system_aesthetic_test', label: 'Terminaciones y estética conforme', type: 'checkbox', required: true },
      { id: 'p_field_5', name: 'manuals_delivered', label: 'Manuales de usuario y operación entregados', type: 'checkbox', required: false },
      { id: 'p_field_6', name: 'asbuilt_plans_delivered', label: 'Planos As-Built entregados', type: 'checkbox', required: false },
      { id: 'p_field_7', name: 'warranties_delivered', label: 'Pólizas de garantía entregadas', type: 'checkbox', required: false },
      { id: 'p_field_8', name: 'training_provided', label: 'Capacitación a usuarios realizada', type: 'checkbox', required: true },
      { id: 'p_field_9', name: 'pending_issues', label: 'Observaciones o Trabajos Pendientes (si aplica)', type: 'textarea', required: false },
      { id: 'p_field_10', name: 'client_conformity_text', label: 'Declaración de Conformidad del Cliente', type: 'textarea', required: true },
      { id: 'p_field_11', name: 'client_representative_name', label: 'Nombre del Representante del Cliente', type: 'text', required: true },
      { id: 'p_field_12', name: 'project_manager_name', label: 'Nombre del Jefe de Proyecto/Responsable', type: 'select', required: true, options: 'technicians' },
      { id: 'p_field_13', name: 'delivery_date', label: 'Fecha de Entrega', type: 'date', required: true },
    ]
  }
];
