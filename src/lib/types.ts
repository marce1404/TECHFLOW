

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

export type Invoice = {
  id: string;
  number: string;
  date: string;
  amount: number;
};

export type WorkOrder = {
  id:string;
  createdAt?: string;
  ot_number: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  description: string;
  notes: string;
  client: string;
  service: string;
  assigned: string[];
  comercial: string;
  status: 'Por Iniciar' | 'En Progreso' | 'Pendiente' | 'Atrasada' | 'Cerrada' | 'Actividad';
  priority: 'Baja' | 'Media' | 'Alta';
  technicians: string[];
  vehicles: string[];
  netPrice: number;
  invoices?: Invoice[];
  invoiceRequestDates?: string[];
  invoiceNumber?: string; // For data migration from old structure
  ocNumber?: string;
  rut?: string;
  saleNumber?: string;
  hesEmMigo?: string;
  rentedVehicle?: string;
  manualProgress?: number;
  facturado?: boolean;
  isActivity?: boolean;
  activityName?: string;
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
  company?: string;
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

export type Filters = {
  search: string;
  clients: string[];
  services: string[];
  technicians: string[];
  supervisors: string[];
  priorities: string[];
  statuses: string[];
  dateRange: import("react-day-picker").DateRange;
  invoicedStatus: 'all' | 'invoiced' | 'not_invoiced';
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
  displayName: z.string().min(3).describe("The user's new full name."),
  email: z.string().email().describe("The user's new email."),
  role: z.enum(['Admin', 'Supervisor', 'Técnico', 'Visor']).describe('The new role for the user.'),
  status: z.enum(['Activo', 'Inactivo']).describe('The new status for the user.'),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const CreateUserInputSchema = UpdateUserInputSchema.extend({
    password: z.string().min(6).describe('The new password for the user.')
}).omit({uid: true});
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;


export const CreateWorkOrderInputSchemaForExcel = z.object({
  ot_number: z.string().min(1, 'ot_number no puede estar vacío.'),
  description: z.string().min(1, 'description no puede estar vacío.'),
  client: z.string().min(1, 'client no puede estar vacío.'),
  service: z.string().min(1, 'service no puede estar vacío.'),
  date: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Por Iniciar', 'En Progreso', 'Pendiente', 'Atrasada', 'Cerrada']),
  priority: z.enum(['Baja', 'Media', 'Alta']).optional(),
  netPrice: z.number().optional().default(0),
  ocNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  assigned: z.string().optional(),
  technicians: z.string().optional(),
});
export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderInputSchemaForExcel>;


export const UpdateUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type UpdateUserOutput = z.infer<typeof UpdateUserOutputSchema>;

// Attachment type for emails
export type MailAttachment = {
  filename: string;
  content: string; // base64 encoded
};
