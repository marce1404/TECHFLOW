import type { WorkOrder, Technician, Vehicle, GanttChart } from './types';

export const overviewStats = {
  open: '124',
  overdue: '16',
  totalTechnicians: '32',
  highPriority: '8',
  closedThisMonth: '45',
};

export const activeWorkOrders: WorkOrder[] = [
  { id: '1', ot_number: 'OT-2024-001', description: 'Instalación de AC', client: 'Constructora XYZ', service: 'HVAC', assigned: 'Juan Pérez', status: 'En Progreso', priority: 'Alta' },
  { id: '2', ot_number: 'OT-2024-002', description: 'Reparación de fuga', client: 'Hospital Central', service: 'Plomería', assigned: 'Maria García', status: 'Por Iniciar', priority: 'Alta' },
  { id: '3', ot_number: 'OT-2024-003', description: 'Mantenimiento eléctrico', client: 'Oficinas Corp.', service: 'Electricidad', assigned: 'Carlos Rivas', status: 'Pendiente', priority: 'Media' },
  { id: '4', ot_number: 'OT-2024-004', description: 'Revisión sistema de seguridad', client: 'Mall del Centro', service: 'Seguridad', assigned: 'Ana Torres', status: 'Atrasada', priority: 'Media' },
  { id: '5', ot_number: 'OT-2024-005', description: 'Cambio de bomba de agua', client: 'Condominio El Roble', service: 'Plomería', assigned: 'Juan Pérez', status: 'En Progreso', priority: 'Baja' },
];

export const recentWorkOrders = activeWorkOrders.slice(0, 5);

export const historicalWorkOrders: WorkOrder[] = [
    { id: '6', ot_number: 'OT-2023-101', description: 'Instalación de cámaras', client: 'Colegio San José', service: 'Seguridad', assigned: 'Ana Torres', status: 'Cerrada', priority: 'Media' },
    { id: '7', ot_number: 'OT-2023-102', description: 'Mantenimiento preventivo', client: 'Industrias ACME', service: 'HVAC', assigned: 'Juan Pérez', status: 'Cerrada', priority: 'Baja' },
]

export const technicians: Technician[] = [
    { id: '1', name: 'Juan Pérez', specialty: 'HVAC', area: 'Norte', status: 'Activo' },
    { id: '2', name: 'Maria García', specialty: 'Plomería', area: 'Centro', status: 'Activo' },
    { id: '3', name: 'Carlos Rivas', specialty: 'Electricidad', area: 'Sur', status: 'Licencia' },
    { id: '4', name: 'Ana Torres', specialty: 'Seguridad', area: 'Norte', status: 'Activo' },
]

export const vehicles: Vehicle[] = [
    { id: '1', model: 'Toyota Hilux', plate: 'PPU-1234', status: 'Asignado' },
    { id: '2', model: 'Ford Ranger', plate: 'PPU-5678', status: 'Disponible' },
    { id: '3', model: 'Nissan Navara', plate: 'PPU-9012', status: 'Mantenimiento' },
]

export const ganttCharts: GanttChart[] = [
    { id: '1', name: 'Proyecto Edificio Central', assignedOT: 'OT-2024-001', taskCount: 15 },
    { id: '2', name: 'Renovación Hospital', assignedOT: 'OT-2024-002', taskCount: 25 },
    { id: '3', name: 'Instalación Mall', assignedOT: '', taskCount: 40 },
]

export const availableTechniciansString = `1. Juan Pérez: HVAC, 2 tareas activas, disponible mañana.
2. Maria García: Plomería, 1 tarea activa, disponible hoy.
3. Carlos Rivas: Electricidad, 4 tareas activas, disponible en 3 días.
4. Ana Torres: Seguridad y redes, 0 tareas activas, disponible hoy.
5. Pedro Soto: Plomería y HVAC, 2 tareas activas, disponible hoy por la tarde.`;

export const availableVehiclesString = `1. Camioneta Ford Ranger: Capacidad media, herramientas de plomería, ubicada en bodega central, disponible.
2. Furgón Peugeot Partner: Capacidad pequeña, herramientas eléctricas, en ruta, disponible en 2 horas.
3. Camioneta Toyota Hilux: Capacidad grande, herramientas generales, ubicada en bodega norte, disponible.`;
