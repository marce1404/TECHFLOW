import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, Info, FileText, Building } from 'lucide-react';
import packageJson from '@/../package.json';

export default function SettingsPage() {
    const settingsOptions = [
        {
            title: 'Datos de la Empresa',
            description: 'Gestiona el nombre, eslogan y dirección de tu empresa.',
            href: '/settings/company-details',
            icon: Building,
        },
        {
            title: 'Categorías de OT',
            description: 'Gestiona las categorías de las órdenes de trabajo.',
            href: '/settings/ot-categories',
        },
        {
            title: 'Estados de OT',
            description: 'Gestiona los estados de las órdenes de trabajo.',
            href: '/settings/ot-statuses',
        },
        {
            title: 'Servicios',
            description: 'Gestiona los servicios ofrecidos.',
            href: '/settings/services',
        },
        {
            title: 'Tareas Sugeridas para Gantt',
            description: 'Gestiona las tareas predefinidas para las Cartas Gantt.',
            href: '/settings/suggested-tasks',
        },
         {
            title: 'Plantillas de Informes',
            description: 'Crea y gestiona los formatos para informes y guías.',
            href: '/settings/report-templates',
            icon: FileText
        },
    ];

    const appVersion = packageJson.version;

    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {settingsOptions.map((option) => (
                    <Link href={option.href} key={option.href}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        {option.icon && <option.icon className="h-5 w-5" />}
                                        {option.title}
                                    </CardTitle>
                                    <CardDescription>{option.description}</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Versión de la Aplicación
                        </CardTitle>
                        <CardDescription>
                            Versión actual del software TechFlow.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold font-mono text-primary">{appVersion}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
