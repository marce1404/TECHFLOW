
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronRight, Building, Users, Settings, BarChart2, Tag, ListChecks, ClipboardPenLine, GitBranch, Mail } from 'lucide-react';
import packageJson from '@/../package.json';

interface SettingsGroupProps {
    title: string;
    children: React.ReactNode;
}

const SettingsGroup = ({ title, children }: SettingsGroupProps) => (
    <div>
        <h2 className="text-xl font-semibold font-headline mb-4 px-2">{title}</h2>
        <div className="grid grid-cols-1 gap-4">
            {children}
        </div>
    </div>
);

interface SettingsLinkProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

const SettingsLink = ({ href, icon: Icon, title, description }: SettingsLinkProps) => (
  <Link href={href}>
    <Card className="hover:bg-muted/50 transition-colors group">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary transition-colors">
            <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
    </Card>
  </Link>
);


export default function SettingsPage() {
    const appVersion = packageJson.version;

    return (
        <div className="flex flex-col gap-10">
            <SettingsGroup title="General">
                <SettingsLink 
                    href="/settings/company-details"
                    icon={Building}
                    title="Datos de la Empresa"
                    description="Gestiona el nombre, eslogan y dirección de tu empresa."
                />
                <SettingsLink 
                    href="/settings/users"
                    icon={Users}
                    title="Usuarios y Permisos"
                    description="Gestiona los usuarios que pueden acceder al sistema y sus roles."
                />
                <SettingsLink 
                    href="/settings/smtp-settings"
                    icon={Mail}
                    title="Configuración de Correo"
                    description="Configura el servidor SMTP para el envío de correos electrónicos."
                />
            </SettingsGroup>

            <SettingsGroup title="Gestión de Órdenes de Trabajo">
                 <SettingsLink 
                    href="/settings/ot-categories"
                    icon={Tag}
                    title="Categorías de OT"
                    description="Crea y administra los prefijos para tus órdenes de trabajo (ej. OT, OS, OM)."
                />
                 <SettingsLink 
                    href="/settings/ot-statuses"
                    icon={ListChecks}
                    title="Estados de OT"
                    description="Define los estados que puede tener una orden de trabajo en su ciclo de vida."
                />
                 <SettingsLink 
                    href="/settings/services"
                    icon={Settings}
                    title="Servicios"
                    description="Administra los diferentes tipos de servicios que tu empresa ofrece."
                />
            </SettingsGroup>
            
            <SettingsGroup title="Herramientas y Plantillas">
                <SettingsLink 
                    href="/settings/suggested-tasks"
                    icon={BarChart2}
                    title="Tareas Sugeridas para Gantt"
                    description="Gestiona las tareas predefinidas para las Cartas Gantt."
                />
                <SettingsLink 
                    href="/settings/report-templates"
                    icon={ClipboardPenLine}
                    title="Plantillas de Informes"
                    description="Crea y gestiona los formatos para informes y guías de servicio."
                />
            </SettingsGroup>

            <SettingsGroup title="Sistema">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <GitBranch className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-lg">Versión de la Aplicación</CardTitle>
                            <CardDescription>Versión actual del software TechFlow.</CardDescription>
                        </div>
                         <p className="text-2xl font-bold font-mono text-primary">{appVersion}</p>
                    </CardHeader>
                </Card>
            </SettingsGroup>
        </div>
    );
}
