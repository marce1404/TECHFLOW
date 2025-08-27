
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
  { order: 1, phase: "Fase 1: Planificación y Diseño", category: "cctv", name: "Levantamiento y Evaluación de Requisitos del Cliente" },
  { order: 2, phase: "Fase 1: Planificación y Diseño", category: "cctv", name: "Diseño del Sistema de CCTV y Ubicación de Cámaras" },
  { order: 3, phase: "Fase 1: Planificación y Diseño", category: "cctv", name: "Selección de Equipos (Cámaras, NVR/DVR, Cableado)" },
  { order: 4, phase: "Fase 2: Adquisición y Preparación", category: "cctv", name: "Compra y Recepción de Equipos y Materiales" },
  { order: 5, phase: "Fase 2: Adquisición y Preparación", category: "cctv", name: "Preparación de Herramientas y Equipos de Instalación" },
  { order: 6, phase: "Fase 3: Instalación y Montaje", category: "cctv", name: "Canalización y Cableado Estructurado" },
  { order: 7, phase: "Fase 3: Instalación y Montaje", category: "cctv", name: "Montaje y Fijación de Cámaras" },
  { order: 8, phase: "Fase 3: Instalación y Montaje", category: "cctv", name: "Instalación de NVR/DVR y Conexión de Alimentación" },
  { order: 9, phase: "Fase 4: Configuración y Puesta en Marcha", category: "cctv", name: "Conexión y Configuración de Red" },
  { order: 10, phase: "Fase 4: Configuración y Puesta en Marcha", category: "cctv", name: "Configuración del Software de Gestión de Video (VMS)" },
  { order: 11, phase: "Fase 4: Configuración y Puesta en Marcha", category: "cctv", name: "Ajuste de Cámaras (Enfoque, Ángulo, IR)" },
  { order: 12, phase: "Fase 5: Pruebas y Entrega", category: "cctv", name: "Pruebas de Grabación y Acceso Remoto" },
  { order: 13, phase: "Fase 5: Pruebas y Entrega", category: "cctv", name: "Capacitación a Usuario Final" },
  { order: 14, phase: "Fase 5: Pruebas y Entrega", category: "cctv", name: "Elaboración de Documentación y Planos As-Built" },
  { order: 15, phase: "Fase 5: Pruebas y Entrega", category: "cctv", name: "Entrega y Recepción Conforme del Proyecto" },
  // CCAA
  { order: 16, phase: "Fase 1: Diseño y Planificación", category: "ccaa", name: "Evaluación de Puntos de Acceso y Niveles de Seguridad" },
  { order: 17, phase: "Fase 1: Diseño y Planificación", category: "ccaa", name: "Diseño del Sistema (Controladores, Lectoras, Cerraduras)" },
  { order: 18, phase: "Fase 2: Instalación Física", category: "ccaa", name: "Instalación de Controladores y Fuentes de Poder" },
  { order: 19, phase: "Fase 2: Instalación Física", category: "ccaa", name: "Instalación de Lectoras de Tarjetas/Biométricas" },
  { order: 20, phase: "Fase 2: Instalación Física", category: "ccaa", name: "Instalación de Cerraduras Electromagnéticas/Pestillos" },
  { order: 21, phase: "Fase 2: Instalación Física", category: "ccaa", name: "Instalación de Botones de Salida y Sensores de Puerta" },
  { order: 22, phase: "Fase 3: Cableado y Conexión", category: "ccaa", name: "Tendido de Cableado para Lectoras y Dispositivos" },
  { order: 23, phase: "Fase 3: Cableado y Conexión", category: "ccaa", name: "Conexión de Dispositivos al Controlador" },
  { order: 24, phase: "Fase 4: Configuración y Puesta en Marcha", category: "ccaa", name: "Configuración del Software de Control de Acceso" },
  { order: 25, phase: "Fase 4: Configuración y Puesta en Marcha", category: "ccaa", name: "Registro de Usuarios y Asignación de Permisos" },
  { order: 26, phase: "Fase 5: Pruebas y Entrega", category: "ccaa", name: "Pruebas de Funcionamiento por Puerta" },
  { order: 27, phase: "Fase 5: Pruebas y Entrega", category: "ccaa", name: "Capacitación a Administradores del Sistema" },
  { order: 28, phase: "Fase 5: Pruebas y Entrega", category: "ccaa", name: "Entrega de Proyecto y Documentación" },
  // ABLOY
  { order: 29, phase: "Fase 1: Asesoría y Planificación", category: "abloy", name: "Levantamiento de Necesidades y Plan de Amaestramiento" },
  { order: 30, phase: "Fase 1: Asesoría y Planificación", category: "abloy", name: "Especificación de Cilindros y Llaves" },
  { order: 31, phase: "Fase 2: Instalación y Montaje", category: "abloy", name: "Instalación de Cilindros en Puertas" },
  { order: 32, phase: "Fase 2: Instalación y Montaje", category: "abloy", name: "Montaje de Candados y Cajas de Bloqueo" },
  { order: 33, phase: "Fase 3: Entrega y Capacitación", category: "abloy", name: "Entrega de Llaves y Tarjetas de Propiedad" },
  { order: 34, phase: "Fase 3: Entrega y Capacitación", category: "abloy", name: "Capacitación sobre Uso y Gestión del Sistema" },
  // Alarma
  { order: 35, phase: "Fase 1: Diseño de Seguridad", category: "alarma", name: "Análisis de Vulnerabilidades y Diseño de Cobertura" },
  { order: 36, phase: "Fase 2: Instalación de Componentes", category: "alarma", name: "Instalación de Panel Central y Teclado" },
  { order: 37, phase: "Fase 2: Instalación de Componentes", category: "alarma", name: "Instalación de Sensores de Movimiento (PIR)" },
  { order: 38, phase: "Fase 2: Instalación de Componentes", category: "alarma", name: "Instalación de Contactos Magnéticos en Puertas/Ventanas" },
  { order: 39, phase: "Fase 2: Instalación de Componentes", category: "alarma", name: "Instalación de Sirena Interior y Exterior" },
  { order: 40, phase: "Fase 3: Configuración y Pruebas", category: "alarma", name: "Programación de Zonas y Tiempos de Retardo" },
  { order: 41, phase: "Fase 3: Configuración y Pruebas", category: "alarma", name: "Configuración de Comunicación con Central de Monitoreo" },
  { order: 42, phase: "Fase 4: Entrega", category: "alarma", name: "Pruebas de Intrusión y Pánico" },
  { order: 43, phase: "Fase 4: Entrega", category: "alarma", name: "Capacitación al Usuario sobre Armado/Desarmado" },
  // Deteccion
  { order: 44, phase: "Fase 1: Ingeniería y Diseño", category: "detección", name: "Diseño de Detección y Alarma según Normativa" },
  { order: 45, phase: "Fase 2: Instalación de Detección", category: "detección", name: "Instalación de Panel de Incendio" },
  { order: 46, phase: "Fase 2: Instalación de Detección", category: "detección", name: "Instalación de Detectores de Humo y Temperatura" },
  { order: 47, phase: "Fase 2: Instalación de Detección", category: "detección", name: "Instalación de Palancas de Alarma Manual" },
  { order: 48, phase: "Fase 3: Instalación de Notificación", category: "detección", name: "Instalación de Sirenas con Estroboscopio" },
  { order: 49, phase: "Fase 3: Instalación de Notificación", category: "detección", name: "Cableado de Circuitos de Notificación (NAC)" },
  { order: 50, phase: "Fase 4: Pruebas y Certificación", category: "detección", name: "Pruebas de Lazo y Dispositivos" },
  { order: 51, phase: "Fase 4: Pruebas y Certificación", category: "detección", name: "Elaboración de Informe para Certificación" },
  // Extinción
  { order: 52, phase: "Fase 1: Diseño y Planificación", category: "extinción", name: "Levantamiento y Cálculo Hidráulico" },
  { order: 53, phase: "Fase 1: Diseño y Planificación", category: "extinción", name: "Diseño de Red de Rociadores (Sprinklers)" },
  { order: 54, phase: "Fase 2: Montaje de Tuberías", category: "extinción", name: "Prefabricado y Montaje de Tuberías (Piping)" },
  { order: 55, phase: "Fase 2: Montaje de Tuberías", category: "extinción", name: "Instalación de Soportes y Anclajes" },
  { order: 56, phase: "Fase 3: Instalación de Componentes", category: "extinción", name: "Instalación de Rociadores (Sprinklers)" },
  { order: 57, phase: "Fase 3: Instalación de Componentes", category: "extinción", name: "Instalación de Válvulas y Sala de Bombas" },
  { order: 58, phase: "Fase 4: Pruebas y Puesta en Marcha", category: "extinción", name: "Prueba de Presión y Estanqueidad (Hidrostática)" },
  { order: 59, phase: "Fase 4: Pruebas y Puesta en Marcha", category: "extinción", name: "Puesta en Marcha del Sistema de Bombeo" },
  { order: 60, phase: "Fase 4: Pruebas y Puesta en Marcha", category: "extinción", name: "Pruebas de Flujo" },
  { order: 61, phase: "Fase 5: Entrega", category: "extinción", name: "Entrega y Certificación del Sistema" },
];

    