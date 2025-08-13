
import { z } from 'zod';
import type { ChartConfig } from "@/components/ui/chart"

export type StatCardData = {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
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
  vendedor: string;
  status: 'Por Iniciar' | 'En Progreso' | 'Pendiente' | 'Atrasada' | 'Cerrada';
  priority: 'Baja' | 'Media' | 'Alta';
  facturado: boolean;
  technicians: string[];
  vehicles: string[];
  netPrice: number;
  invoiceNumber?: string;
  ocNumber?: string;
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
  role: 'Técnico' | 'Supervisor' | 'Coordinador' | 'Jefe de Proyecto' | 'Encargado' | 'Vendedor';
  area: string;
  status: 'Activo' | 'Licencia' | 'Vacaciones';
  license: string;
  workClothing: WorkClothingItem[];
  epp: EPPItem[];
  certifications: CertificationItem[];
};

export type CollaboratorPrintData = Omit<Collaborator, 'id'>;

export type Vehicle = {
  id: string;
  model: string;
  year: number;
  plate: string;
  status: 'Disponible' | 'Asignado' | 'En Mantenimiento';
  assignedTo?: string;
};

export type GanttTask = {
    id: string;
    name: string;
    startDate: Date;
    duration: number;
    progress: number;
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
}

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
      'A justification for the suggested assignments, considering task requirements and resource availability.'
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
