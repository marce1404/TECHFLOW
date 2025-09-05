
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ManualPage() {
    return (
        <div className="prose dark:prose-invert max-w-none">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Manual de Usuario - TechFlow</CardTitle>
                    <CardDescription>Bienvenido a TechFlow, tu sistema de gestión de operaciones técnicas. Esta guía te ayudará a comprender y utilizar todas las funcionalidades de la aplicación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <section>
                        <h2 className="text-2xl font-semibold font-headline">1. Dashboard</h2>
                        <p>El Dashboard es tu vista principal y te ofrece un resumen rápido del estado de tus operaciones.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Tarjetas de Órdenes de Trabajo (OTs):</strong> Muestra las OTs activas, agrupadas por estado (<code>Atrasada</code>, <code>En Progreso</code>, <code>Pendiente</code>, <code>Por Iniciar</code>). Cada tarjeta muestra el progreso y detalles clave.</li>
                            <li><strong>Tarjeta de OTs Cerradas del Mes:</strong> Un contador de las órdenes de trabajo que se han completado durante el mes actual.</li>
                            <li><strong>Tarjeta de Alertas de Vencimiento:</strong> Muestra los Equipos de Protección Personal (EPP), ropa de trabajo y certificaciones que están a punto de vencer (en los próximos 60 días).</li>
                            <li><strong>Modo Pantalla Completa:</strong> Utiliza el botón de expandir para ver el dashboard en pantalla completa, ideal para monitores en la oficina. Las páginas rotarán automáticamente.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold font-headline">2. Órdenes de Trabajo (OTs)</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold">2.1. OTs Activas</h3>
                                <p>Esta sección muestra todas las órdenes de trabajo que no han sido marcadas como "Cerrada".</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Crear una Nueva OT:</strong> Haz clic en el botón "Nueva OT" para abrir el formulario de creación. Debes completar al menos el Nombre, Categoría y Número de OT.</li>
                                    <li><strong>Filtrar y Buscar:</strong> Puedes usar la barra de búsqueda para encontrar OTs por número, cliente o descripción. También puedes usar los filtros avanzados para una búsqueda más detallada por fechas, servicios, técnicos, etc.</li>
                                    <li><strong>Cambiar Estado:</strong> En la tabla, puedes hacer clic en el estado de una OT para cambiarlo rápidamente (ej. de "Por Iniciar" a "En Progreso").</li>
                                </ul>
                            </div>
                             <div>
                                <h3 className="text-xl font-semibold">2.2. Historial de OTs</h3>
                                <p>Aquí encontrarás todas las OTs que han sido marcadas como "Cerrada".</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Búsqueda y Filtros:</strong> Similar a las OTs activas, puedes buscar y filtrar para encontrar órdenes de trabajo antiguas.</li>
                                    <li><strong>Totales de Facturación:</strong> En la parte inferior, verás un resumen del monto total facturado y el monto pendiente por facturar de todas las OTs históricas.</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold">2.3. Editar una OT</h3>
                                <p>Al hacer clic en una OT (ya sea activa o histórica), accederás a la pantalla de edición.</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Modificar Datos:</strong> Puedes cambiar cualquier campo de la OT.</li>
                                    <li><strong>Gestión de Facturas:</strong> En la parte inferior, puedes añadir múltiples facturas a una OT, especificando número, fecha y monto neto. El sistema calculará automáticamente los saldos pendientes.</li>
                                    <li><strong>Enviar a Facturar:</strong> Usa este botón para enviar un correo electrónico pre-formateado al departamento de facturación con todos los detalles necesarios.</li>
                                    <li><strong>Cerrar una OT:</strong> Al cambiar el estado a "Cerrada", el sistema te pedirá que confirmes la fecha de cierre. Una vez cerrada, la OT se moverá al historial.</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold font-headline">3. Planificador</h2>
                        <p>El planificador te permite visualizar y agendar tus OTs y actividades en un calendario.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Vistas:</strong> Puedes cambiar entre vista de "Mes" y "Semana".</li>
                            <li><strong>Agendar:</strong> Haz clic en un día en el calendario para abrir el diálogo de agendamiento.
                                <ul className="list-disc list-inside pl-6">
                                    <li>Puedes agendar una <strong>OT existente</strong> seleccionándola de la lista.</li>
                                    <li>O puedes crear una <strong>actividad rápida</strong> (ej. "Visita técnica") sin necesidad de una OT.</li>
                                </ul>
                            </li>
                            <li><strong>Reagendar:</strong> Arrastra y suelta un evento de un día a otro para cambiar su fecha rápidamente.</li>
                            <li><strong>Desprogramar:</strong> Pasa el mouse sobre un evento y haz clic en la "X" para quitarlo del calendario. Esto no elimina la OT, solo la desprograma y la devuelve al estado "Por Iniciar".</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold font-headline">4. Cartas Gantt</h2>
                         <p>Esta sección te permite planificar proyectos complejos.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Crear Carta Gantt:</strong> Al crear una nueva carta, puedes darle un nombre y, opcionalmente, cargar tareas predefinidas seleccionando una categoría de servicio.</li>
                            <li><strong>Editar Carta Gantt:</strong>
                                <ul className="list-disc list-inside pl-6">
                                    <li><strong>Añadir Tareas:</strong> Puedes añadir tareas personalizadas a cualquier fase.</li>
                                    <li><strong>Gestionar Tareas:</strong> Modifica el nombre, fecha de inicio, duración y progreso de cada tarea. El sistema calculará automáticamente la fecha de término.</li>
                                    <li><strong>Asociar a OT:</strong> Puedes vincular una Carta Gantt a una OT específica. El progreso de la Gantt se reflejará automáticamente en el Dashboard para esa OT.</li>
                                </ul>
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold font-headline">5. Informes</h2>
                         <p>Genera y gestiona informes de servicio y guías de campo.</p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-semibold">5.1. Llenar Informe</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>En esta sección verás una lista de todas las OTs activas que <strong>no tienen</strong> un informe asociado.</li>
                                    <li>Haz clic en "Llenar Informe" para una OT específica.</li>
                                    <li><strong>Selecciona una Plantilla:</strong> Elige el formato de informe que deseas completar (ej. "Guía de Atención Técnica").</li>
                                    <li><strong>Completa los Campos:</strong> Rellena todos los campos del formulario.</li>
                                    <li><strong>Guardar y Enviar:</strong> Al guardar, se te presentará un diálogo para enviar el informe por correo electrónico al cliente y otros destinatarios.</li>
                                </ul>
                            </div>
                             <div>
                                <h3 className="text-xl font-semibold">5.2. Historial de Informes</h3>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Aquí puedes ver todos los informes que ya han sido guardados.</li>
                                    <li><strong>Acciones:</strong>
                                        <ul className="list-disc list-inside pl-6">
                                            <li><strong>Editar:</strong> Modifica un informe ya guardado.</li>
                                            <li><strong>Enviar por correo:</strong> Vuelve a enviar el informe si es necesario.</li>
                                            <li><strong>Ver/Imprimir:</strong> Abre una vista previa del informe lista para ser impresa o guardada como PDF.</li>
                                            <li><strong>Eliminar:</strong> Borra permanentemente un informe.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold font-headline">6. Colaboradores</h2>
                        <p>Gestiona a todo tu personal.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Crear/Editar:</strong> Añade nuevos colaboradores o edita los existentes.</li>
                            <li><strong>EPP y Vestimenta:</strong> En la ficha de cada colaborador, puedes llevar un registro detallado de la ropa de trabajo, equipos de protección y sus fechas de entrega y caducidad.</li>
                            <li><strong>Certificaciones:</strong> Registra las certificaciones de cada técnico con sus fechas de emisión y vencimiento.</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h2 className="text-2xl font-semibold font-headline">7. Alertas</h2>
                        <p>Esta página es un centro de control para los vencimientos. Muestra una tabla con todos los EPP, ropa de trabajo y certificaciones de <strong>todos los colaboradores</strong> que están vencidos o próximos a vencer, ordenados por urgencia.</p>
                    </section>

                     <section>
                        <h2 className="text-2xl font-semibold font-headline">8. Vehículos</h2>
                        <p>Administra la flota de vehículos de la empresa.</p>
                         <ul className="list-disc list-inside space-y-2">
                            <li><strong>Crear/Editar:</strong> Registra nuevos vehículos con su información (modelo, patente, etc.).</li>
                            <li><strong>Asignación:</strong> Asigna un vehículo a un colaborador. El estado del vehículo cambiará automáticamente a "Asignado".</li>
                            <li><strong>Registro de Mantenimiento:</strong> Lleva un historial detallado de todas las mantenciones y reparaciones realizadas a cada vehículo, incluyendo costos y kilometraje.</li>
                        </ul>
                    </section>
                    
                     <section>
                        <h2 className="text-2xl font-semibold font-headline">9. Asistente IA</h2>
                        <p>Utiliza la inteligencia artificial para agilizar tu trabajo.</p>
                         <ul className="list-disc list-inside space-y-2">
                            <li><strong>Sugerir Recursos:</strong> Describe una tarea y la IA te sugerirá qué técnicos y vehículos son los más adecuados según su disponibilidad y habilidades.</li>
                            <li><strong>Sugerir Tareas Gantt:</strong> Describe un proyecto y la IA te generará una lista estructurada de fases y tareas para tu Carta Gantt.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold font-headline">10. Configuración</h2>
                        <p>Esta sección es principalmente para los administradores.</p>
                        <ul className="list-disc list-inside space-y-2">
                            <li><strong>Datos de la Empresa:</strong> Configura el nombre y eslogan que aparecerán en los informes.</li>
                            <li><strong>Usuarios y Permisos:</strong> Crea nuevos usuarios, asigna roles y gestiona sus permisos.</li>
                            <li><strong>Configuración de Correo (SMTP):</strong> Es <strong>crucial</strong> configurar esto para que el sistema pueda enviar correos electrónicos (informes, notificaciones, etc.).</li>
                             <li><strong>Gestión de Datos:</strong>
                                <ul className="list-disc list-inside pl-6">
                                    <li><strong>Importar/Exportar:</strong> Sube masivamente OTs desde un archivo Excel o exporta las existentes.</li>
                                    <li><strong>Respaldo Completo:</strong> Descarga una copia de seguridad de toda la información de la aplicación (OTs, colaboradores, vehículos, etc.) en formato JSON.</li>
                                </ul>
                            </li>
                            <li><strong>Categorías, Estados y Servicios de OT:</strong> Personaliza las listas desplegables que se usan al crear órdenes de trabajo.</li>
                            <li><strong>Tareas Sugeridas para Gantt:</strong> Administra las listas de tareas que se pueden precargar al crear una Carta Gantt.</li>
                            <li><strong>Plantillas de Informes:</strong> Diseña y modifica los formularios que los técnicos llenarán en terreno.</li>
                        </ul>
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
