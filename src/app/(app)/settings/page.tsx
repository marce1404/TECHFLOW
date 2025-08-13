
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function SettingsPage() {
    const settingsOptions = [
        {
            title: 'Categorías de OT',
            description: 'Gestiona las categorías de las órdenes de trabajo.',
            href: '/settings/ot-categories',
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
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {settingsOptions.map((option) => (
                    <Link href={option.href} key={option.href}>
                        <Card className="hover:bg-muted/50 transition-colors h-full">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>{option.title}</CardTitle>
                                    <CardDescription>{option.description}</CardDescription>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
