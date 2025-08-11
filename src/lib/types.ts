
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

export type Technician = {
  id: string;
  name: string;
  specialty: string;
  area: string;
  status: 'Activo' | 'Licencia' | 'Vacaciones';
};

export type Vehicle = {
  id: string;
  model: string;
  plate: string;
  status: 'Disponible' | 'Asignado' | 'Mantenimiento';
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
