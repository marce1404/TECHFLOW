
# Manual de Usuario - TechFlow

Bienvenido a TechFlow, tu sistema de gestión de operaciones técnicas. Esta guía te ayudará a comprender y utilizar todas las funcionalidades de la aplicación.

## 1. Dashboard

El Dashboard es tu vista principal y te ofrece un resumen rápido del estado de tus operaciones.

- **Tarjetas de Órdenes de Trabajo (OTs):** Muestra las OTs activas, agrupadas por estado (`Atrasada`, `En Progreso`, `Pendiente`, `Por Iniciar`). Cada tarjeta muestra el progreso y detalles clave.
- **Tarjeta de OTs Cerradas del Mes:** Un contador de las órdenes de trabajo que se han completado durante el mes actual.
- **Tarjeta de Alertas de Vencimiento:** Muestra los Equipos de Protección Personal (EPP), ropa de trabajo y certificaciones que están a punto de vencer (en los próximos 60 días).
- **Modo Pantalla Completa:** Utiliza el botón de expandir para ver el dashboard en pantalla completa, ideal para monitores en la oficina. Las páginas rotarán automáticamente.

## 2. Órdenes de Trabajo (OTs)

### 2.1. OTs Activas

Esta sección muestra todas las órdenes de trabajo que no han sido marcadas como "Cerrada".

- **Crear una Nueva OT:** Haz clic en el botón "Nueva OT" para abrir el formulario de creación. Debes completar al menos el Nombre, Categoría y Número de OT.
- **Filtrar y Buscar:** Puedes usar la barra de búsqueda para encontrar OTs por número, cliente o descripción. También puedes usar los filtros avanzados para una búsqueda más detallada por fechas, servicios, técnicos, etc.
- **Cambiar Estado:** En la tabla, puedes hacer clic en el estado de una OT para cambiarlo rápidamente (ej. de "Por Iniciar" a "En Progreso").

### 2.2. Historial de OTs

Aquí encontrarás todas las OTs que han sido marcadas como "Cerrada".

- **Búsqueda y Filtros:** Similar a las OTs activas, puedes buscar y filtrar para encontrar órdenes de trabajo antiguas.
- **Totales de Facturación:** En la parte inferior, verás un resumen del monto total facturado y el monto pendiente por facturar de todas las OTs históricas.

### 2.3. Editar una OT

Al hacer clic en una OT (ya sea activa o histórica), accederás a la pantalla de edición.

- **Modificar Datos:** Puedes cambiar cualquier campo de la OT.
- **Gestión de Facturas:** En la parte inferior, puedes añadir múltiples facturas a una OT, especificando número, fecha y monto neto. El sistema calculará automáticamente los saldos pendientes.
- **Enviar a Facturar:** Usa este botón para enviar un correo electrónico pre-formateado al departamento de facturación con todos los detalles necesarios.
- **Cerrar una OT:** Al cambiar el estado a "Cerrada", el sistema te pedirá que confirmes la fecha de cierre. Una vez cerrada, la OT se moverá al historial.

## 3. Planificador

El planificador te permite visualizar y agendar tus OTs y actividades en un calendario.

- **Vistas:** Puedes cambiar entre vista de "Mes" y "Semana".
- **Agendar:** Haz clic en un día en el calendario para abrir el diálogo de agendamiento.
    - Puedes agendar una **OT existente** seleccionándola de la lista.
    - O puedes crear una **actividad rápida** (ej. "Visita técnica") sin necesidad de una OT.
- **Reagendar:** Arrastra y suelta un evento de un día a otro para cambiar su fecha rápidamente.
- **Desprogramar:** Pasa el mouse sobre un evento y haz clic en la "X" para quitarlo del calendario. Esto no elimina la OT, solo la desprograma y la devuelve al estado "Por Iniciar".

## 4. Cartas Gantt

Esta sección te permite planificar proyectos complejos.

- **Crear Carta Gantt:** Al crear una nueva carta, puedes darle un nombre y, opcionalmente, cargar tareas predefinidas seleccionando una categoría de servicio.
- **Editar Carta Gantt:**
    - **Añadir Tareas:** Puedes añadir tareas personalizadas a cualquier fase.
    - **Gestionar Tareas:** Modifica el nombre, fecha de inicio, duración y progreso de cada tarea. El sistema calculará automáticamente la fecha de término.
    - **Asociar a OT:** Puedes vincular una Carta Gantt a una OT específica. El progreso de la Gantt se reflejará automáticamente en el Dashboard para esa OT.

## 5. Informes

Genera y gestiona informes de servicio y guías de campo.

### 5.1. Llenar Informe

- En esta sección verás una lista de todas las OTs activas que **no tienen** un informe asociado.
- Haz clic en "Llenar Informe" para una OT específica.
- **Selecciona una Plantilla:** Elige el formato de informe que deseas completar (ej. "Guía de Atención Técnica").
- **Completa los Campos:** Rellena todos los campos del formulario.
- **Guardar y Enviar:** Al guardar, se te presentará un diálogo para enviar el informe por correo electrónico al cliente y otros destinatarios.

### 5.2. Historial de Informes

- Aquí puedes ver todos los informes que ya han sido guardados.
- **Acciones:**
    - **Editar:** Modifica un informe ya guardado.
    - **Enviar por correo:** Vuelve a enviar el informe si es necesario.
    - **Ver/Imprimir:** Abre una vista previa del informe lista para ser impresa o guardada como PDF.
    - **Eliminar:** Borra permanentemente un informe.

## 6. Colaboradores

Gestiona a todo tu personal.

- **Crear/Editar:** Añade nuevos colaboradores o edita los existentes.
- **EPP y Vestimenta:** En la ficha de cada colaborador, puedes llevar un registro detallado de la ropa de trabajo, equipos de protección y sus fechas de entrega y caducidad.
- **Certificaciones:** Registra las certificaciones de cada técnico con sus fechas de emisión y vencimiento.

## 7. Alertas

Esta página es un centro de control para los vencimientos. Muestra una tabla con todos los EPP, ropa de trabajo y certificaciones de **todos los colaboradores** que están vencidos o próximos a vencer, ordenados por urgencia.

## 8. Vehículos

Administra la flota de vehículos de la empresa.

- **Crear/Editar:** Registra nuevos vehículos con su información (modelo, patente, etc.).
- **Asignación:** Asigna un vehículo a un colaborador. El estado del vehículo cambiará automáticamente a "Asignado".
- **Registro de Mantenimiento:** Lleva un historial detallado de todas las mantenciones y reparaciones realizadas a cada vehículo, incluyendo costos y kilometraje.

## 9. Asistente IA

Utiliza la inteligencia artificial para agilizar tu trabajo.

- **Sugerir Recursos:** Describe una tarea y la IA te sugerirá qué técnicos y vehículos son los más adecuados según su disponibilidad y habilidades.
- **Sugerir Tareas Gantt:** Describe un proyecto y la IA te generará una lista estructurada de fases y tareas para tu Carta Gantt.

## 10. Configuración

Esta sección es principalmente para los administradores.

- **Datos de la Empresa:** Configura el nombre y eslogan que aparecerán en los informes.
- **Usuarios y Permisos:** Crea nuevos usuarios, asigna roles y gestiona sus permisos.
- **Configuración de Correo (SMTP):** Es **crucial** configurar esto para que el sistema pueda enviar correos electrónicos (informes, notificaciones, etc.).
- **Gestión de Datos:**
    - **Importar/Exportar:** Sube masivamente OTs desde un archivo Excel o exporta las existentes.
    - **Respaldo Completo:** Descarga una copia de seguridad de toda la información de la aplicación (OTs, colaboradores, vehículos, etc.) en formato JSON.
- **Categorías, Estados y Servicios de OT:** Personaliza las listas desplegables que se usan al crear órdenes de trabajo.
- **Tareas Sugeridas para Gantt:** Administra las listas de tareas que se pueden precargar al crear una Carta Gantt.
- **Plantillas de Informes:** Diseña y modifica los formularios que los técnicos llenarán en terreno.
