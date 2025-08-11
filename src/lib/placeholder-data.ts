
import type { WorkOrder, Technician, Vehicle, GanttChart, OTCategory, Service } from './types';

export const overviewStats = {
  open: '26',
  overdue: '3',
  totalTechnicians: '32',
  highPriority: '5',
  closedThisMonth: '0',
};

export const activeWorkOrders: WorkOrder[] = [
  { id: '1', ot_number: 'OT-1374', date: '2025-01-20', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 16) Enero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: 'ALEXANDER', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 25742143 },
  { id: '2', ot_number: 'OT-1374', date: '2025-01-23', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 17) Enero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: 'ALEXANDER', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 2000088 },
  { id: '3', ot_number: 'OT-1374', date: '2025-01-23', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 18) Enero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: 'ALEXANDER', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 1865252 },
  { id: '4', ot_number: 'OT-1497', date: '2025-01-07', endDate: '', description: 'EQUIPAMIENTO MLP STATCOM', notes: 'OC 4510225009', client: 'MLP', service: 'CCAA', assigned: 'PEDRO', vendedor: 'Eric Landeros', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 2561195 },
  { id: '5', ot_number: 'OT-1501', date: '2025-01-22', endDate: '', description: 'ANGLO AMERICAN SUMINISTRO DE CANDADOS PROTEC 2', notes: 'OC 4503592938', client: 'ANGLO AMERICAN', service: 'ABLOY', assigned: 'PEDRO', vendedor: 'Claudina Manqui', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 4199300 },
  { id: '6', ot_number: 'OT-1502', date: '2025-01-22', endDate: '', description: 'ANGLO AMERICAN SUMINISTRO DE CANDADOS PROTEC 2 CON C', notes: 'OC 4503589975', client: 'ANGLO AMERICAN', service: 'ABLOY', assigned: 'PEDRO', vendedor: 'Claudina Manqui', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 1063000 },
  { id: '7', ot_number: 'OT-1503', date: '2025-01-22', endDate: '', description: 'ANGLO AMERICAN SUMINISTRO LLAVES TA77ZZ PROTEC2', notes: 'OC 4500585945', client: 'ANGLO AMERICAN', service: 'ABLOY', assigned: 'PEDRO', vendedor: 'Claudina Manqui', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 999500 },
  { id: '8', ot_number: 'OT-1498', date: '2025-01-13', endDate: '', description: 'ZENIT - MNTTO DETECTORES Y SPRINLERS N°2 - MALL BUENAVENTURA', notes: '', client: 'T ARQUITECTURA INGENIERIA Y CONSTRUCCION', service: 'INCENDIO', assigned: 'FRANCISCO', vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 1624678 },
  { id: '9', ot_number: 'OT-1507', date: '2025-01-31', endDate: '', description: 'IMPORPER MAESTRANZA-MONITOREO-SAN EUGENIO 12351 - SAN', notes: 'OC 100592', client: 'INVERSIONES COLLINS Y COLLINS', service: 'ALARMA', assigned: 'ELIO', vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 1030769 },
  { id: '10', ot_number: 'OT-268', date: '2025-02-03', endDate: '', description: 'MLP EEPP 48 (Mantención Enero)', notes: 'OC 4540005027', client: 'MLP', service: 'CCAA', assigned: 'PEDRO', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 36305106 },
  { id: '11', ot_number: 'OT-1509', date: '2025-02-10', endDate: '', description: 'PAULINA QUIROZ DIAGNOSTICO SISTEMA DE CCTV', notes: 'Sin OC', client: 'PAULINA QUIROZ', service: 'CCTV', assigned: 'FRANCISCO', vendedor: 'Carlos Puga', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 95925 },
  { id: '12', ot_number: 'OT-1506', date: '2025-01-30', endDate: '', description: 'EQUIPAMIENTO PATACHE 01 CMDIC', notes: 'OC B33481', client: 'COLLAHUASI', service: 'ABLOY', assigned: 'ALEXANDER', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 2976884 },
  { id: '13', ot_number: 'OT-1374', date: '2025-02-19', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 19) Febrero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: 'ALEXANDER', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 26742143 },
  { id: '14', ot_number: 'OT-1499', date: '2025-01-13', endDate: '', description: 'KCC MILL SODEXO MANTENCION SISTEMA CCTV N°1', notes: 'OC 71530-60', client: 'SODEXO', service: 'CCTV', assigned: 'FRANCISCO', vendedor: 'Marcelo Sepulveda', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 371429 },
  { id: '15', ot_number: 'OT-1514', date: '2025-02-20', endDate: '', description: 'KCC MILL SODEXO MANTENCION SISTEMA CCTV N°2', notes: 'OC 71540-36', client: 'SODEXO', service: 'CCTV', assigned: 'FRANCISCO', vendedor: 'Marcelo Sepulveda', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 371429 },
  { id: '16', ot_number: 'OT-1514', date: '2025-02-20', endDate: '', description: 'KCC MILL SODEXO MANTENCION SISTEMA CCTV N°2 - ALZA HOMBRE', notes: 'OC 75640-30', client: 'SODEXO', service: 'CCAA', assigned: 'FRANCISCO', vendedor: 'Marcelo Sepulveda', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 580000 },
  { id: '17', ot_number: 'OT-1510', date: '2025-02-12', endDate: '', description: 'BANINTERFACTORING, MIGRACION ENTRAPASS STAND ALONE A', notes: 'OC 237', client: 'BANINTERFACTORING', service: 'CCAA', assigned: 'FRANCISCO', vendedor: 'Carlos Puga', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 136413 },
  { id: '18', ot_number: 'OT-1517', date: '2025-02-26', endDate: '', description: 'EQUIPAMIENTO ACOMIN', notes: 'OC 2965', client: 'ACOMIN', service: 'ABLOY', assigned: 'PEDRO', vendedor: 'Eric Landeros', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 762252 },
  { id: '19', ot_number: 'OT-1518', date: '2025-03-04', endDate: '', description: 'GOOGLE PUERTA CASINO REVISION OPERADOR', notes: 'OC 040325', client: 'CD INGENIERIA', service: 'ABLOY', assigned: 'FRANCISCO', vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 208159 },
  { id: '20', ot_number: 'OT-1511', date: '2025-02-14', endDate: '', description: 'BANINTERFACTORING, INSTALACION DE ENTRAPASS DESDE CER', notes: 'OC 238', client: 'BANINTERFACTORING', service: 'CCAA', assigned: 'FRANCISCO', vendedor: 'Carlos Puga', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 121063 },
  { id: '21', ot_number: 'OT-1508', date: '2025-01-31', endDate: '', description: 'AUTOKAS REVISION CCAA Y COMPUTADOR', notes: '', client: 'AUTOKAS', service: 'CCAA', assigned: 'FRANCISCO', vendedor: 'Carlos Puga', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 95960 },
  { id: '22', ot_number: 'OT-268', date: '2025-03-12', endDate: '', description: 'MLP EEPP 49 (Mantención Febrero)', notes: 'OC 4540005027', client: 'MLP', service: 'CCAA', assigned: 'PEDRO', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 27820636 },
  { id: '23', ot_number: 'OT-1516', date: '2025-02-21', endDate: '', description: 'BANCO BICE VITACURA REEMPLAZO DE CERRADURA Y LLAVES', notes: 'OC 4500013671', client: 'BANCO BICE', service: 'ABLOY', assigned: 'ELIO', vendedor: 'Denisse Vilches', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 340480 },
  { id: '24', ot_number: 'OT-1519', date: '2025-03-13', endDate: '', description: 'BISHARA BJ - SISTEMA DE DETECCION DE INCENDIO - VECINOS', notes: 'Autorización por correo', client: 'BISHARA SPA', service: 'INCENDIO', assigned: 'ELIO', vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 6939994 },
  { id: '25', ot_number: 'OT-1521', date: '2025-03-14', endDate: '', description: 'F & S HIDRAULICA Y MONTAJE INDUSTRIAL LTDA -VENTA DE EQUI', notes: 'OC ADQ/2025/4634', client: 'F & S HIDRAULICA Y MONTAJE INDUSTRIAL LTDA', service: 'VENTA', assigned: 'ELIO', vendedor: 'Angel Contreras', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 1076706 },
  { id: '26', ot_number: 'OT-1374', date: '2025-03-21', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 20) Marzo', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: 'ALEXANDER', vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 25742143 },
  { id: '27', ot_number: 'OT-1524', date: '2025-03-20', endDate: '', description: 'PAULINA QUIROZ INSTALACION DE CCTV BUIN', notes: '', client: 'PAULINA QUIROZ', service: 'CCTV', assigned: 'FABIAN', vendedor: 'Carlos Puga', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 572712 }
];


export const recentWorkOrders = activeWorkOrders.slice(0, 5);

export const historicalWorkOrders: WorkOrder[] = []

export const technicians: Technician[] = [
    { 
        id: '1', 
        name: 'Cristian Muñoz', 
        specialty: 'Climatización', 
        area: 'RM', 
        status: 'Activo',
        license: 'Clase B',
        workClothing: [
            { id: '1', item: 'Pantalón Corporativo', size: '44', quantity: 2, deliveryDate: '2025-08-11', expirationDate: '2026-08-11' },
            { id: '2', item: 'Camisa Corporativa', size: 'M', quantity: 2, deliveryDate: '2025-08-11', expirationDate: '2026-08-11' },
        ]
    },
    { 
        id: '2', 
        name: 'Beatriz Herrera', 
        specialty: 'Electricidad', 
        area: 'RM', 
        status: 'Activo',
        license: 'Clase B',
        workClothing: []
    },
    { 
        id: '3', 
        name: 'Andrés Castillo', 
        specialty: 'Seguridad', 
        area: 'Zona Norte', 
        status: 'Licencia',
        license: 'Clase B',
        workClothing: []
    },
    { 
        id: '4', 
        name: 'Juan Pérez', 
        specialty: 'Obras Civiles', 
        area: 'Zona Sur', 
        status: 'Activo',
        license: 'Clase B',
        workClothing: []
    },
    { 
        id: '5', 
        name: 'Ana Torres', 
        specialty: 'Redes y CCTV', 
        area: 'RM', 
        status: 'Vacaciones',
        license: 'Clase B',
        workClothing: []
    },
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

export const otCategories: OTCategory[] = [
    { id: '1', name: 'Servicio', prefix: 'OS', status: 'Activa' },
    { id: '2', name: 'Proyecto', prefix: 'OT', status: 'Activa' },
    { id: '3', name: 'Mantención', prefix: 'OM', status: 'Activa' },
    { id: '4', name: 'Otro', prefix: 'OTR', status: 'Inactiva' },
    { id: '5', name: 'Abloy', prefix: 'ABLOY', status: 'Activa' },
];

export const services: Service[] = [
    { id: '1', name: 'CCTV', status: 'Activa' },
    { id: '2', name: 'Extinción', status: 'Activa' },
    { id: '3', name: 'Cerco', status: 'Activa' },
    { id: '4', name: 'Detección', status: 'Activa' },
    { id: '5', name: 'Alarma', status: 'Activa' },
    { id: '6', name: 'CCAA', status: 'Activa' },
    { id: '7', name: 'ABLOY', status: 'Activa' },
    { id: '8', name: 'INCENDIO', status: 'Activa' },
    { id: '9', name: 'VENTA', status: 'Activa' },
]


export const availableTechniciansString = `1. Juan Pérez: HVAC, 2 tareas activas, disponible mañana.
2. Maria García: Plomería, 1 tarea activa, disponible hoy.
3. Carlos Rivas: Electricidad, 4 tareas activas, disponible en 3 días.
4. Ana Torres: Seguridad y redes, 0 tareas activas, disponible hoy.
5. Pedro Soto: Plomería y HVAC, 2 tareas activas, disponible hoy por la tarde.`;

export const availableVehiclesString = `1. Camioneta Ford Ranger: Capacidad media, herramientas de plomería, ubicada en bodega central, disponible.
2. Furgón Peugeot Partner: Capacidad pequeña, herramientas eléctricas, en ruta, disponible en 2 horas.
3. Camioneta Toyota Hilux: Capacidad grande, herramientas generales, ubicada en bodega norte, disponible.`;
