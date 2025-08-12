

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
  assigned: string;
  vendedor: string;
  status: 'Por Iniciar' | 'En Progreso' | 'Pendiente' | 'Atrasada' | 'Cerrada';
  priority: 'Baja' | 'Media' | 'Alta';
  facturado: boolean;
  technicians: string[];
  vehicles: string[];
  netPrice: number;
  invoiceNumber?: string;
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

export type GanttChart = {
  id: string;
  name: string;
  assignedOT: string;
  taskCount: number;
};

export type OTCategory = {
  id: string;
  name: string;
  prefix: string;
  status: 'Activa' | 'Inactiva';
};

export type Service = {
  id:string;
  name: string;
  status: 'Activa' | 'Inactiva';
};
