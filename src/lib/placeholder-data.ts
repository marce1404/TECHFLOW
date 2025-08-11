import type { WorkOrder, Technician, Vehicle, GanttChart } from './types';

export const overviewStats = {
  open: '124',
  overdue: '16',
  totalTechnicians: '32',
  highPriority: '8',
  closedThisMonth: '45',
};

export const activeWorkOrders: WorkOrder[] = [
  { id: '1', ot_number: 'OT-004', date: '2025-08-10', endDate: '2025-08-15', description: 'LIPIGAS CCTV CONCON 1', notes: 'Instalación de 10 cámaras domo y 2 NVRs.', client: 'LIPI', service: 'CCTV', assigned: 'Cristian Muñoz', vendedor: 'Fernanda Gómez', status: 'En Progreso', priority: 'Alta', facturado: false, technicians: ['cristian-munoz', 'andres-castillo'], vehicles: ['hilux'], netPrice: 1500000 },
  { id: '2', ot_number: 'OM-002', date: '2024-07-30', endDate: '2024-08-02', description: 'Mantenimiento de red húmeda y red seca', notes: 'Revisión de bombas y gabinetes.', client: 'Universidad de Chile', service: 'Extincion', assigned: 'Cristian Muñoz', vendedor: 'Fernanda Gómez', status: 'Por Iniciar', priority: 'Alta', facturado: false, technicians: ['cristian-munoz'], vehicles: [], netPrice: 750000 },
  { id: '3', ot_number: 'OS-004', date: '2024-07-28', endDate: '2024-07-29', description: 'Reparación de barreras de control de acceso vehicular', notes: 'Falla en motor de barrera de acceso principal.', client: 'Aeropuerto de Santiago', service: 'Cerco', assigned: 'Beatriz Herrera', vendedor: 'Eduardo Flores', status: 'En Progreso', priority: 'Media', facturado: true, technicians: ['beatriz-herrera'], vehicles: ['ranger'], netPrice: 300000 },
  { id: '4', ot_number: 'OM-001', date: '2024-07-25', endDate: '2024-07-26', description: 'Revisión y limpieza de 150 cámaras de seguridad', notes: 'Mantenimiento semestral programado.', client: 'Mall Plaza Vespucio', service: 'CCTV', assigned: 'Andrés Castillo', vendedor: 'Daniela Vidal', status: 'Pendiente', priority: 'Media', facturado: false, technicians: ['andres-castillo', 'ana-torres'], vehicles: ['navara'], netPrice: 1200000 },
  { id: '5', ot_number: 'OT-003', date: '2024-07-22', endDate: '2024-07-31', description: 'Instalación de sistema de detección de incendios', notes: 'Instalación en piso 10 y 11.', client: 'Costanera Center', service: 'Deteccion', assigned: 'Cristian Muñoz', vendedor: 'Fernanda Gómez', status: 'En Progreso', priority: 'Baja', facturado: false, technicians: ['cristian-munoz'], vehicles: ['hilux'], netPrice: 2500000 },
  { id: '6', ot_number: 'OT-002', date: '2024-07-20', endDate: '2024-08-20', description: 'Instalación de sistema VRV para piso 15 del edificio.', notes: '', client: 'Edificio Corporativo Falabella', service: 'Alarma', assigned: 'Cristian Muñoz', vendedor: 'Fernanda Gómez', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 5000000 },
  { id: '7', ot_number: 'OS-001', date: '2024-07-18', endDate: '2024-07-18', description: 'Certificación anual', notes: 'Certificación de sistema de alarma.', client: 'Laboratorios Saval', service: 'Deteccion', assigned: 'Beatriz Herrera', vendedor: 'Eduardo Flores', status: 'Pendiente', priority: 'Baja', facturado: false, technicians: ['beatriz-herrera'], vehicles: [], netPrice: 200000 },
  { id: '8', ot_number: 'OT-001', date: '2024-07-15', endDate: '2024-07-19', description: 'Mantenimiento preventivo', notes: 'Mantenimiento general de sistemas de seguridad.', client: 'Clínica Las Condes', service: 'CCTV', assigned: 'Andrés Castillo', vendedor: 'Daniela Vidal', status: 'En Progreso', priority: 'Baja', facturado: false, technicians: ['andres-castillo'], vehicles: ['ranger'], netPrice: 450000 },
];

export const recentWorkOrders = activeWorkOrders.slice(0, 5);

export const historicalWorkOrders: WorkOrder[] = [
    { id: '9', ot_number: 'OT-2023-101', date: '2023-12-15', endDate: '2023-12-20', description: 'Instalación de cámaras', notes: '', client: 'Colegio San José', service: 'Seguridad', assigned: 'Ana Torres', vendedor: 'Daniela Vidal', status: 'Cerrada', priority: 'Media', facturado: true, technicians: ['ana-torres'], vehicles: [], netPrice: 600000 },
    { id: '10', ot_number: 'OT-2023-102', date: '2023-11-20', endDate: '2023-11-22', description: 'Mantenimiento preventivo', notes: '', client: 'Industrias ACME', service: 'HVAC', assigned: 'Juan Pérez', vendedor: 'Fernanda Gómez', status: 'Cerrada', priority: 'Baja', facturado: true, technicians: ['juan-perez'], vehicles: [], netPrice: 250000 },
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

    