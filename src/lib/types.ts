

import { z } from 'zod';
import type { ChartConfig } from "@/components/ui/chart"
import { Timestamp } from 'firebase/firestore';

export type StatCardData = {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
};

export type AppUser = {
  uid: string;
  email: string;
  displayName: string;
  role: 'Admin' | 'Supervisor' | 'Técnico' | 'Visor';
  status: 'Activo' | 'Inactivo';
};

export type WorkOrder = {
  id: string;
  ot_number: string;
  date: string;
  endDate?: string;
  description: string;
  notes: string;
  client: string;
  service: string;
  assigned: string[];
  comercial: string;
  status: 'Por Iniciar' | 'En Proceso' | 'Pendiente' | 'Atrasada' | 'Cerrada';
  priority: 'Baja' | 'Media' | 'Alta';
  facturado: boolean;
  technicians: string[];
  vehicles: string[];
  netPrice: number;
  invoiceNumber?: string;
  ocNumber?: string;
  rut?: string;
  saleNumber?: string;
  hesEmMigo?: string;
  rentedVehicle?: string;
};

export type WorkClothingItem = {
  id: string;
  item?: string;
  size?: string;
  quantity?: number;
  deliveryDate?: string;
  expirationDate?: string;
};

export type EPPItem = {
  id: string;
  item?: string;
  size?: string;
  quantity?: number;
  deliveryDate?: string;
  expirationDate?: string;
};

export type CertificationItem = {
  id: string;
  name?: string;
  issuingOrganization?: string;
  issueDate?: string;
  expirationDate?: string;
};


export type Collaborator = {
  id: string;
  name: string;
  email?: string;
  role: 'Técnico' | 'Supervisor' | 'Coordinador' | 'Jefe de Proyecto' | 'Encargado' | 'Comercial';
  area: string;
  status: 'Activo' | 'Licencia' | 'Vacaciones';
  license: string;
  workClothing: WorkClothingItem[];
  epp: EPPItem[];
  certifications: CertificationItem[];
};

export type CollaboratorPrintData = Omit<Collaborator, 'id'>;

export type VehicleMaintenance = {
  id: string;
  date: string;
  description: string;
  cost: number;
  mileage: number;
};

export type Vehicle = {
  id: string;
  model: string;
  year: number;
  plate: string;
  status: 'Disponible' | 'Asignado' | 'En Mantenimiento';
  assignedTo?: string;
  maintenanceLog?: VehicleMaintenance[];
};

export type GanttTask = {
    id: string;
    name: string;
    startDate: Date;
    duration: number;
    progress: number;
    isPhase?: boolean;
    phase: string;
    order: number;
}

export type GanttChart = {
  id: string;
  name: string;
  assignedOT?: string;
  workOnSaturdays: boolean;
  workOnSundays: boolean;
  tasks: GanttTask[];
};

export type OTCategory = {
  id: string;
  name: string;
  prefix: string;
  status: 'Activa' | 'Inactiva';
};

export type OTStatus = {
  id: string;
  name: string;
};

export type Service = {
  id:string;
  name: string;
  status: 'Activa' | 'Inactiva';
};

export type SuggestedTask = {
    id: string;
    name: string;
    category: string; // This will be the lowercase name of the service
    phase: string;
    order: number;
    isPhasePlaceholder?: boolean;
}

export type ReportTemplateField = {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'checkbox' | 'date' | 'select';
    required: boolean;
    options?: 'technicians';
}
export type ReportTemplate = {
    id: string;
    name: string;
    description: string;
    type: 'service-guide' | 'project-delivery';
    fields: ReportTemplateField[];
}

export type SubmittedReport = {
    id: string;
    workOrderId: string;
    templateId: string;
    reportData: Record<string, any>;
    otDetails: {
        ot_number: string;
        client: string;
        description: string;
        netPrice: number;
        comercial?: string;
    };
    templateName: string;
    submittedAt: Timestamp;
};

export type CompanyInfo = {
    name: string;
    slogan?: string;
    address?: string;
};

export type SmtpConfig = {
    host: string;
    port: number;
    secure: 'none' | 'ssl' | 'starttls';
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
};


// AI Resource Assignment Types
export const SuggestOptimalResourceAssignmentInputSchema = z.object({
  taskRequirements: z
    .string()
    .describe('A description of the task requirements, including skills needed, tools, and time estimate.'),
  availableTechnicians: z
    .string()
    .describe(
      'A list of available technicians with their skills, current workload, and availability.'
    ),
  availableVehicles: z
    .string()
    .describe(
      'A list of available vehicles with their type, capacity, location, and availability.'
    ),
});
export type SuggestOptimalResourceAssignmentInput = z.infer<
  typeof SuggestOptimalResourceAssignmentInputSchema
>;

export const SuggestOptimalResourceAssignmentOutputSchema = z.object({
  suggestedTechnicians: z
    .string()
    .describe('A list of suggested technicians for the task.'),
  suggestedVehicles: z.string().describe('A list of suggested vehicles for the task.'),
  justification: z
    .string()
    .describe(
      'A justification for the suggested assignments, considering task requirements and resource availability. TODA LA RESPUESTA DEBE ESTAR EN ESPAÑOL.'
    ),
});
export type SuggestOptimalResourceAssignmentOutput = z.infer<
  typeof SuggestOptimalResourceAssignmentOutputSchema
>;

export const SuggestOptimalResourceAssignmentOutputWithErrorSchema =
  SuggestOptimalResourceAssignmentOutputSchema.or(z.object({ error: z.string() }));

export type SuggestOptimalResourceAssignmentOutputWithError = z.infer<
    typeof SuggestOptimalResourceAssignmentOutputWithErrorSchema
    >;

export const DonutChartConfig = {
  progress: {
    label: "Avance",
  },
} satisfies ChartConfig;

export type DonutChartData = {
    name: 'progress';
    value: number;
    fill: string;
};


// User Management Types

export const UpdateUserInputSchema = z.object({
  uid: z.string().describe('The unique ID of the user to update.'),
  name: z.string().min(3).describe("The user's new full name."),
  role: z.enum(['Admin', 'Supervisor', 'Técnico', 'Visor']).describe('The new role for the user.'),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const UpdateUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type UpdateUserOutput = z.infer<typeof UpdateUserOutputSchema>;

// Excel Import Types & API Types
const baseWorkOrderStatuses = ['Por Iniciar', 'En Proceso', 'Pendiente', 'Atrasada', 'Cerrada'];

export const CreateWorkOrderInputSchema = z.object({
  ot_number: z.string().describe("The unique work order number, including prefix. E.g., 'OT-1525'"),
  description: z.string().describe("The name or description of the work order."),
  client: z.string().describe("The client's name for this work order."),
  rut: z.string().optional().describe("The client's RUT."),
  service: z.string().describe("The service category, e.g., 'CCTV', 'CCAA'."),
  date: z.string().describe("The start date of the work order in 'YYYY-MM-DD' format."),
  endDate: z.string().optional().describe("The potential end date in 'YYYY-MM-DD' format."),
  notes: z.string().optional().describe("Additional notes or a detailed description."),
  status: z.enum(baseWorkOrderStatuses as [string, ...string[]]).describe("The initial status of the work order."),
  priority: z.enum(['Baja', 'Media', 'Alta']).describe("The priority of the work order."),
  netPrice: z.number().describe("The net price of the work order."),
  ocNumber: z.string().optional().describe("The Purchase Order (OC) number, if available."),
  invoiceNumber: z.string().optional().describe("The invoice number, if available."),
  assigned: z.array(z.string()).optional().default([]).describe("A list of names for assigned supervisors/managers."),
  technicians: z.array(z.string()).optional().default([]).describe("A list of names for assigned technicians."),
  vehicles: z.array(z.string()).optional().default([]).describe("A list of assigned vehicles."),
  comercial: z.string().optional().describe("The name of the salesperson."),
  saleNumber: z.string().optional().describe("The sale number."),
  hesEmMigo: z.string().optional().describe("The HES/EM/MIGO number."),
  rentedVehicle: z.string().optional().describe("Details of a rented vehicle."),
});
export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderInputSchema>;

export const CreateWorkOrderInputSchemaForExcel = CreateWorkOrderInputSchema.extend({
    status: z.enum(baseWorkOrderStatuses as [string, ...string[]])
});


export const CreateWorkOrderOutputSchema = z.object({
  success: z.boolean(),
  orderId: z.string().optional(),
  message: z.string(),
});
export type CreateWorkOrderOutput = z.infer<typeof CreateWorkOrderOutputSchema>;
