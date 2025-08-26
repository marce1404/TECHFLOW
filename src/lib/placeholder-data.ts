
import type { WorkOrder, Collaborator, Vehicle, GanttChart, OTCategory, Service, SuggestedTask } from './types';

export const overviewStats = {
  open: '26',
  overdue: '3',
  totalCollaborators: '32',
  highPriority: '5',
  closedThisMonth: '0',
};

export const activeWorkOrders: WorkOrder[] = [
  { id: '1', ot_number: 'OT-1374', date: '2025-01-20', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 16) Enero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: ['ALEXANDER'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 25742143 },
  { id: '2', ot_number: 'OT-1374', date: '2025-01-23', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 17) Enero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: ['ALEXANDER'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 2000088 },
  { id: '3', ot_number: 'OT-1374', date: '2025-01-23', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 18) Enero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: ['ALEXANDER'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 1865252 },
  { id: '4', ot_number: 'OT-1497', date: '2025-01-07', endDate: '', description: 'EQUIPAMIENTO MLP STATCOM', notes: 'OC 4510225009', client: 'MLP', service: 'CCAA', assigned: ['PEDRO'], vendedor: 'Eric Landeros', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 2561195 },
  { id: '5', ot_number: 'OT-1501', date: '2025-01-22', endDate: '', description: 'ANGLO AMERICAN SUMINISTRO DE CANDADOS PROTEC 2', notes: 'OC 4503592938', client: 'ANGLO AMERICAN', service: 'ABLOY', assigned: ['PEDRO'], vendedor: 'Claudina Manqui', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 4199300 },
  { id: '6', ot_number: 'OT-1502', date: '2025-01-22', endDate: '', description: 'ANGLO AMERICAN SUMINISTRO DE CANDADOS PROTEC 2 CON C', notes: 'OC 4503589975', client: 'ANGLO AMERICAN', service: 'ABLOY', assigned: ['PEDRO'], vendedor: 'Claudina Manqui', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 1063000 },
  { id: '7', ot_number: 'OT-1503', date: '2025-01-22', endDate: '', description: 'ANGLO AMERICAN SUMINISTRO LLAVES TA77ZZ PROTEC2', notes: 'OC 4500585945', client: 'ANGLO AMERICAN', service: 'ABLOY', assigned: ['PEDRO'], vendedor: 'Claudina Manqui', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 999500 },
  { id: '8', ot_number: 'OT-1498', date: '2025-01-13', endDate: '', description: 'ZENIT - MNTTO DETECTORES Y SPRINLERS N°2 - MALL BUENAVENTURA', notes: '', client: 'T ARQUITECTURA INGENIERIA Y CONSTRUCCION', service: 'INCENDIO', assigned: ['FRANCISCO'], vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 1624678 },
  { id: '9', ot_number: 'OT-1507', date: '2025-01-31', endDate: '', description: 'IMPORPER MAESTRANZA-MONITOREO-SAN EUGENIO 12351 - SAN', notes: 'OC 100592', client: 'INVERSIONES COLLINS Y COLLINS', service: 'ALARMA', assigned: ['ELIO'], vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 1030769 },
  { id: '10', ot_number: 'OT-268', date: '2025-02-03', endDate: '', description: 'MLP EEPP 48 (Mantención Enero)', notes: 'OC 4540005027', client: 'MLP', service: 'CCAA', assigned: ['PEDRO'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 36305106 },
  { id: '11', ot_number: 'OT-1509', date: '2025-02-10', endDate: '', description: 'PAULINA QUIROZ DIAGNOSTICO SISTEMA DE CCTV', notes: 'Sin OC', client: 'PAULINA QUIROZ', service: 'CCTV', assigned: ['FRANCISCO'], vendedor: 'Carlos Puga', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 95925 },
  { id: '12', ot_number: 'OT-1506', date: '2025-01-30', endDate: '', description: 'EQUIPAMIENTO PATACHE 01 CMDIC', notes: 'OC B33481', client: 'COLLAHUASI', service: 'ABLOY', assigned: ['ALEXANDER'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 2976884 },
  { id: '13', ot_number: 'OT-1374', date: '2025-02-19', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 19) Febrero', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: ['ALEXANDER'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 26742143 },
  { id: '14', ot_number: 'OT-1499', date: '2025-01-13', endDate: '', description: 'KCC MILL SODEXO MANTENCION SISTEMA CCTV N°1', notes: 'OC 71530-60', client: 'SODEXO', service: 'CCTV', assigned: ['FRANCISCO'], vendedor: 'Marcelo Sepulveda', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 371429 },
  { id: '15', ot_number: 'OT-1514', date: '2025-02-20', endDate: '', description: 'KCC MILL SODEXO MANTENCION SISTEMA CCTV N°2', notes: 'OC 71540-36', client: 'SODEXO', service: 'CCTV', assigned: ['FRANCISCO'], vendedor: 'Marcelo Sepulveda', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 371429 },
  { id: '16', ot_number: 'OT-1514', date: '2025-02-20', endDate: '', description: 'KCC MILL SODEXO MANTENCION SISTEMA CCTV N°2 - ALZA HOMBRE', notes: 'OC 75640-30', client: 'SODEXO', service: 'CCAA', assigned: ['FRANCISCO'], vendedor: 'Marcelo Sepulveda', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 580000 },
  { id: '17', ot_number: 'OT-1510', date: '2025-02-12', endDate: '', description: 'BANINTERFACTORING, MIGRACION ENTRAPASS STAND ALONE A', notes: 'OC 237', client: 'BANINTERFACTORING', service: 'CCAA', assigned: ['FRANCISCO'], vendedor: 'Carlos Puga', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 136413 },
  { id: '18', ot_number: 'OT-1517', date: '2025-02-26', endDate: '', description: 'EQUIPAMIENTO ACOMIN', notes: 'OC 2965', client: 'ACOMIN', service: 'ABLOY', assigned: ['PEDRO'], vendedor: 'Eric Landeros', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 762252 },
  { id: '19', ot_number: 'OT-1518', date: '2025-03-04', endDate: '', description: 'GOOGLE PUERTA CASINO REVISION OPERADOR', notes: 'OC 040325', client: 'CD INGENIERIA', service: 'ABLOY', assigned: ['FRANCISCO'], vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 208159 },
  { id: '20', ot_number: 'OT-1511', date: '2025-02-14', endDate: '', description: 'BANINTERFACTORING, INSTALACION DE ENTRAPASS DESDE CER', notes: 'OC 238', client: 'BANINTERFACTORING', service: 'CCAA', assigned: ['FRANCISCO'], vendedor: 'Carlos Puga', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 121063 },
  { id: '21', ot_number: 'OT-1508', date: '2025-01-31', endDate: '', description: 'AUTOKAS REVISION CCAA Y COMPUTADOR', notes: '', client: 'AUTOKAS', service: 'CCAA', assigned: ['FRANCISCO'], vendedor: 'Carlos Puga', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 95960 },
  { id: '22', ot_number: 'OT-268', date: '2025-03-12', endDate: '', description: 'MLP EEPP 49 (Mantención Febrero)', notes: 'OC 4540005027', client: 'MLP', service: 'CCAA', assigned: ['PEDRO'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 27820636 },
  { id: '23', ot_number: 'OT-1516', date: '2025-02-21', endDate: '', description: 'BANCO BICE VITACURA REEMPLAZO DE CERRADURA Y LLAVES', notes: 'OC 4500013671', client: 'BANCO BICE', service: 'ABLOY', assigned: ['ELIO'], vendedor: 'Denisse Vilches', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 340480 },
  { id: '24', ot_number: 'OT-1519', date: '2025-03-13', endDate: '', description: 'BISHARA BJ - SISTEMA DE DETECCION DE INCENDIO - VECINOS', notes: 'Autorización por correo', client: 'BISHARA SPA', service: 'INCENDIO', assigned: ['ELIO'], vendedor: 'Angel Contreras', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 6939994 },
  { id: '25', ot_number: 'OT-1521', date: '2025-03-14', endDate: '', description: 'F & S HIDRAULICA Y MONTAJE INDUSTRIAL LTDA -VENTA DE EQUI', notes: 'OC ADQ/2025/4634', client: 'F & S HIDRAULICA Y MONTAJE INDUSTRIAL LTDA', service: 'VENTA', assigned: ['ELIO'], vendedor: 'Angel Contreras', status: 'Por Iniciar', priority: 'Baja', facturado: false, technicians: [], vehicles: [], netPrice: 1076706 },
  { id: '26', ot_number: 'OT-1374', date: '2025-03-21', endDate: '', description: 'COLLAHUASI MANTENCION CCAA VPEO0430 (EEPP 20) Marzo', notes: 'CONTRATO VPEO0430', client: 'COLLAHUASI', service: 'CCAA', assigned: ['ALEXANDER'], vendedor: 'Eric Landeros', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 25742143 },
  { id: '27', ot_number: 'OT-1524', date: '2025-03-20', endDate: '', description: 'PAULINA QUIROZ INSTALACION DE CCTV BUIN', notes: '', client: 'PAULINA QUIROZ', service: 'CCTV', assigned: ['FABIAN'], vendedor: 'Carlos Puga', status: 'En Progreso', priority: 'Media', facturado: false, technicians: [], vehicles: [], netPrice: 572712 }
];


export const recentWorkOrders = activeWorkOrders.slice(0, 5);

export const historicalWorkOrders: WorkOrder[] = []

export const collaborators: Collaborator[] = [
    { 
        id: '1', 
        name: 'Cristian Muñoz', 
        role: 'Técnico', 
        area: 'RM', 
        status: 'Activo',
        license: 'Clase B',
        workClothing: [
            { id: 'wc1', item: 'Pantalón Corporativo', size: '44', quantity: 2, deliveryDate: '2025-08-11', expirationDate: '2026-08-11' },
            { id: 'wc2', item: 'Camisa Corporativa', size: 'M', quantity: 2, deliveryDate: '2025-08-11', expirationDate: '2026-08-11' },
        ],
        epp: [
            { id: 'epp1', item: 'Casco de Seguridad', size: 'L', quantity: 1, deliveryDate: '2025-08-11', expirationDate: '2026-08-11' },
            { id: 'epp2', item: 'Guantes de Seguridad', size: 'M', quantity: 1, deliveryDate: '2025-08-11', expirationDate: '2026-02-11' },
        ],
        certifications: [
            { id: 'cert1', name: 'Certificación Eléctrica SEC', issuingOrganization: 'SEC', issueDate: '2025-01-15', expirationDate: '2029-01-15' },
            { id: 'cert2', name: 'Trabajo en Altura', issuingOrganization: 'Mutual', issueDate: '2025-06-20', expirationDate: '2027-06-20' },
        ]
    },
    { 
        id: '2', 
        name: 'Beatriz Herrera', 
        role: 'Supervisor', 
        area: 'RM', 
        status: 'Activo',
        license: 'Clase B',
        workClothing: [],
        epp: [],
        certifications: [],
    },
    { 
        id: '3', 
        name: 'Andrés Castillo', 
        role: 'Técnico', 
        area: 'Zona Norte', 
        status: 'Licencia',
        license: 'Clase B',
        workClothing: [],
        epp: [],
        certifications: [],
    },
    { 
        id: '4', 
        name: 'Juan Pérez', 
        role: 'Jefe de Proyecto', 
        area: 'Zona Sur', 
        status: 'Activo',
        license: 'Clase B',
        workClothing: [],
        epp: [],
        certifications: [],
    },
    { 
        id: '5', 
        name: 'Ana Torres', 
        role: 'Vendedor', 
        area: 'RM', 
        status: 'Vacaciones',
        license: 'Clase B',
        workClothing: [],
        epp: [],
        certifications: [],
    },
]

export const vehicles: Vehicle[] = [
    { id: '1', model: 'Chevrolet N400 Max', year: 2021, plate: 'PPU-9101', status: 'En Mantenimiento', assignedTo: '' },
    { id: '2', model: 'Citroën Berlingo', year: 2023, plate: 'PPU-5678', status: 'Disponible', assignedTo: '' },
    { id: '3', model: 'Peugeot Partner', year: 2022, plate: 'PPU-1234', status: 'Asignado', assignedTo: 'Javier Morales' },
]

export const ganttCharts: GanttChart[] = [
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


export const initialSuggestedTasks: Omit<SuggestedTask, 'id'>[] = [
    // CCTV
    { name: 'Levantamiento en Terreno y Relevamiento de Puntos', category: 'cctv', phase: 'Fase 1: Planificación y Diseño', order: 101 },
    { name: 'Diseño de Ingeniería de Detalle y Planos', category: 'cctv', phase: 'Fase 1: Planificación y Diseño', order: 102 },
    { name: 'Aprobación de Ingeniería por parte del Cliente', category: 'cctv', phase: 'Fase 1: Planificación y Diseño', order: 103 },
    { name: 'Compra y Adquisición de Equipos (Cámaras, NVR, etc.)', category: 'cctv', phase: 'Fase 2: Adquisición y Logística', order: 201 },
    { name: 'Recepción y Bodegaje de Materiales', category: 'cctv', phase: 'Fase 2: Adquisición y Logística', order: 202 },
    { name: 'Canalización y Tuberías (Eléctricas / Datos)', category: 'cctv', phase: 'Fase 3: Instalación y Montaje', order: 301 },
    { name: 'Cableado Estructurado (UTP / Fibra Óptica)', category: 'cctv', phase: 'Fase 3: Instalación y Montaje', order: 302 },
    { name: 'Montaje de Gabinete y Equipos Centrales (NVR, Switch)', category: 'cctv', phase: 'Fase 3: Instalación y Montaje', order: 303 },
    { name: 'Montaje Físico de Cámaras y Soportes', category: 'cctv', phase: 'Fase 3: Instalación y Montaje', order: 304 },
    { name: 'Configuración de Red y Direccionamiento IP', category: 'cctv', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 401 },
    { name: 'Configuración del Software de Gestión de Video (VMS)', category: 'cctv', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 402 },
    { name: 'Enfoque, Calibración y Pruebas de Cobertura de Cámaras', category: 'cctv', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 403 },
    { name: 'Pruebas de Grabación y Almacenamiento', category: 'cctv', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 404 },
    { name: 'Puesta en Marcha Oficial del Sistema', category: 'cctv', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 405 },
    { name: 'Capacitación a Usuario Final y Administradores', category: 'cctv', phase: 'Fase 5: Cierre y Entrega', order: 501 },
    { name: 'Elaboración de Documentación y Planos As-Built', category: 'cctv', phase: 'Fase 5: Cierre y Entrega', order: 502 },
    { name: 'Entrega y Recepción Conforme del Proyecto', category: 'cctv', phase: 'Fase 5: Cierre y Entrega', order: 503 },
    
    // CCAA (Control de Acceso)
    { name: 'Levantamiento y Definición de Puntos de Control', category: 'ccaa', phase: 'Fase 1: Planificación y Diseño', order: 101 },
    { name: 'Diseño de Topología del Sistema y Ubicación de Equipos', category: 'ccaa', phase: 'Fase 1: Planificación y Diseño', order: 102 },
    { name: 'Aprobación de Diseño por Cliente', category: 'ccaa', phase: 'Fase 1: Planificación y Diseño', order: 103 },
    { name: 'Adquisición de Equipos (Controladoras, Lectoras, Cerraduras)', category: 'ccaa', phase: 'Fase 2: Adquisición y Logística', order: 201 },
    { name: 'Recepción y Verificación de Equipos', category: 'ccaa', phase: 'Fase 2: Adquisición y Logística', order: 202 },
    { name: 'Instalación de Canalizaciones y Tuberías', category: 'ccaa', phase: 'Fase 3: Instalación y Montaje', order: 301 },
    { name: 'Cableado de Puntos de Control a Controladora', category: 'ccaa', phase: 'Fase 3: Instalación y Montaje', order: 302 },
    { name: 'Instalación de Cerraduras Electromagnéticas / Pestillos Eléctricos', category: 'ccaa', phase: 'Fase 3: Instalación y Montaje', order: 303 },
    { name: 'Montaje de Lectoras y Botones de Salida', category: 'ccaa', phase: 'Fase 3: Instalación y Montaje', order: 304 },
    { name: 'Instalación de Panel de Control (Controladora)', category: 'ccaa', phase: 'Fase 3: Instalación y Montaje', order: 305 },
    { name: 'Configuración de Software de Control de Acceso', category: 'ccaa', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 401 },
    { name: 'Creación de Perfiles y Niveles de Acceso', category: 'ccaa', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 402 },
    { name: 'Registro de Tarjetas/Credenciales de Usuarios', category: 'ccaa', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 403 },
    { name: 'Pruebas de Apertura, Cierre y Eventos de Puertas', category: 'ccaa', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 404 },
    { name: 'Integración con otros sistemas (incendio, CCTV)', category: 'ccaa', phase: 'Fase 4: Configuración y Puesta en Marcha', order: 405 },
    { name: 'Marcha Blanca y Ajustes Finales', category: 'ccaa', phase: 'Fase 5: Cierre y Entrega', order: 501 },
    { name: 'Capacitación a Administradores y Usuarios', category: 'ccaa', phase: 'Fase 5: Cierre y Entrega', order: 502 },
    { name: 'Entrega de Documentación y Planos As-Built', category: 'ccaa', phase: 'Fase 5: Cierre y Entrega', order: 503 },
    
    // INCENDIO
    { name: 'Análisis de Riesgos y Diseño según Normativa (NFPA)', category: 'incendio', phase: 'Fase 1: Ingeniería y Diseño', order: 101 },
    { name: 'Elaboración de Planos y Memoria de Cálculo', category: 'incendio', phase: 'Fase 1: Ingeniería y Diseño', order: 102 },
    { name: 'Aprobación de Planos por Autoridad Competente', category: 'incendio', phase: 'Fase 1: Ingeniería y Diseño', order: 103 },
    { name: 'Adquisición de Paneles, Detectores, Módulos y Sirenas', category: 'incendio', phase: 'Fase 2: Adquisición y Logística', order: 201 },
    { name: 'Trazado y Montaje de Tuberías (EMT/PVC)', category: 'incendio', phase: 'Fase 3: Instalación y Montaje', order: 301 },
    { name: 'Cableado de Lazos de Detección (Clase A/B)', category: 'incendio', phase: 'Fase 3: Instalación y Montaje', order: 302 },
    { name: 'Instalación del Panel Central de Incendios (FACP)', category: 'incendio', phase: 'Fase 3: Instalación y Montaje', order: 303 },
    { name: 'Montaje de Detectores de Humo/Temperatura', category: 'incendio', phase: 'Fase 3: Instalación y Montaje', order: 304 },
    { name: 'Montaje de Estaciones Manuales', category: 'incendio', phase: 'Fase 3: Instalación y Montaje', order: 305 },
    { name: 'Montaje de Sirenas con Estroboscópica', category: 'incendio', phase: 'Fase 3: Instalación y Montaje', order: 306 },
    { name: 'Programación de Zonas y Lógica de Activación en Panel', category: 'incendio', phase: 'Fase 4: Configuración y Pruebas', order: 401 },
    { name: 'Pruebas de Continuidad y Aislación de Cableado', category: 'incendio', phase: 'Fase 4: Configuración y Pruebas', order: 402 },
    { name: 'Pruebas Funcionales con Humo/Calor por Dispositivo', category: 'incendio', phase: 'Fase 4: Configuración y Pruebas', order: 403 },
    { name: 'Prueba de Activación de Sirenas y Luces Estroboscópicas', category: 'incendio', phase: 'Fase 4: Configuración y Pruebas', order: 404 },
    { name: 'Certificación del Sistema (SEC/NFPA)', category: 'incendio', phase: 'Fase 5: Certificación y Entrega', order: 501 },
    { name: 'Capacitación a Personal de Emergencia', category: 'incendio', phase: 'Fase 5: Certificación y Entrega', order: 502 },
    { name: 'Entrega de Dossier de Calidad y Planos As-Built', category: 'incendio', phase: 'Fase 5: Certificación y Entrega', order: 503 },

    // ALARMA
    { name: 'Evaluación de Seguridad y Puntos Vulnerables', category: 'alarma', phase: 'Fase 1: Planificación y Diseño', order: 101 },
    { name: 'Diseño del Sistema de Alarma y Zonificación', category: 'alarma', phase: 'Fase 1: Planificación y Diseño', order: 102 },
    { name: 'Adquisición de Panel, Sensores, Teclados y Sirena', category: 'alarma', phase: 'Fase 2: Adquisición y Logística', order: 201 },
    { name: 'Cableado de Sensores de Movimiento y Magnéticos', category: 'alarma', phase: 'Fase 3: Instalación y Montaje', order: 301 },
    { name: 'Instalación y Conexión del Panel Central de Alarma', category: 'alarma', phase: 'Fase 3: Instalación y Montaje', order: 302 },
    { name: 'Instalación de Sensores en Puertas y Ventanas', category: 'alarma', phase: 'Fase 3: Instalación y Montaje', order: 303 },
    { name: 'Instalación de Sensores de Movimiento (PIR)', category: 'alarma', phase: 'Fase 3: Instalación y Montaje', order: 304 },
    { name: 'Instalación de Teclado y Sirena', category: 'alarma', phase: 'Fase 3: Instalación y Montaje', order: 305 },
    { name: 'Configuración de Zonas, Tiempos de Entrada/Salida', category: 'alarma', phase: 'Fase 4: Configuración y Pruebas', order: 401 },
    { name: 'Configuración de Comunicador (GPRS/IP) a Central de Monitoreo', category: 'alarma', phase: 'Fase 4: Configuración y Pruebas', order: 402 },
    { name: 'Pruebas de Activación de cada Zona (Walk-test)', category: 'alarma', phase: 'Fase 4: Configuración y Pruebas', order: 403 },
    { name: 'Pruebas de Comunicación con Central de Monitoreo', category: 'alarma', phase: 'Fase 4: Configuración y Pruebas', order: 404 },
    { name: 'Capacitación al Usuario sobre Uso, Códigos y Procedimientos', category: 'alarma', phase: 'Fase 5: Cierre y Entrega', order: 501 },
    { name: 'Entrega de Manuales y Contactos de Emergencia', category: 'alarma', phase: 'Fase 5: Cierre y Entrega', order: 502 },

    // ABLOY
    { name: 'Evaluación de Seguridad de Puertas y Accesos', category: 'abloy', phase: 'Fase 1: Planificación y Diseño', order: 101 },
    { name: 'Diseño de Sistema de Amaestramiento', category: 'abloy', phase: 'Fase 1: Planificación y Diseño', order: 102 },
    { name: 'Adquisición de Cilindros, Candados y Llaves', category: 'abloy', phase: 'Fase 2: Adquisición y Logística', order: 201 },
    { name: 'Instalación de Cilindros en Puertas', category: 'abloy', phase: 'Fase 3: Instalación y Montaje', order: 301 },
    { name: 'Instalación de Candados en Puntos Definidos', category: 'abloy', phase: 'Fase 3: Instalación y Montaje', order: 302 },
    { name: 'Pruebas de Funcionamiento de Llaves y Cilindros', category: 'abloy', phase: 'Fase 4: Configuración y Pruebas', order: 401 },
    { name: 'Verificación de Plan de Amaestramiento', category: 'abloy', phase: 'Fase 4: Configuración y Pruebas', order: 402 },
    { name: 'Entrega de Llaves y Protocolo de Seguridad', category: 'abloy', phase: 'Fase 5: Cierre y Entrega', order: 501 },
    { name: 'Entrega de Tarjeta de Propiedad y Planos de llaves', category: 'abloy', phase: 'Fase 5: Cierre y Entrega', order: 502 },
];
