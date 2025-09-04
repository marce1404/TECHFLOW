
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useWorkOrders } from '@/context/work-orders-context';
import type { ReportTemplate, CompanyInfo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const ReportField = ({ label, value }: { label: string; value: any }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="text-sm">
            <p className="font-bold mb-1">{label}:</p>
            <p className="text-gray-700 whitespace-pre-wrap pl-1">{String(value)}</p>
        </div>
    );
};

const ReportCheckboxField = ({ label, checked }: { label: string; checked: boolean }) => {
    return (
        <div className="flex items-center gap-2">
            {checked ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
            <span className="font-semibold text-sm">{label}</span>
        </div>
    );
};


export default function PreviewReportTemplatePage() {
    const params = useParams();
    const templateId = params ? params.id as string : '';
    const { reportTemplates, companyInfo, loading: contextLoading } = useWorkOrders();
    const [template, setTemplate] = React.useState<ReportTemplate | null>(null);
    const [loading, setLoading] = React.useState(true);
    
    React.useEffect(() => {
        if (!contextLoading) {
            const foundTemplate = reportTemplates.find(t => t.id === templateId) || null;
            setTemplate(foundTemplate);
        }
        setLoading(contextLoading);
    }, [templateId, reportTemplates, contextLoading]);
    
    const getPlaceholderValue = (field: ReportTemplate['fields'][0]) => {
        switch (field.type) {
            case 'text':
                return `[${field.label}]`;
            case 'textarea':
                return `[${field.label}] - Este es un ejemplo de texto más largo para ver cómo se ajusta en el informe.`;
            case 'number':
                return '12345';
            case 'date':
                return format(new Date(), 'dd/MM/yyyy');
            case 'select':
                return `[Ejemplo de ${field.label}]`;
            case 'checkbox':
                return true;
            default:
                return `[Dato de ejemplo para ${field.label}]`;
        }
    }
    
    React.useEffect(() => {
        if (!loading && template) {
             setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [loading, template]);

    if (loading) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-12 w-1/2"/>
                <Skeleton className="h-8 w-1/3"/>
                <div className="space-y-2 pt-6">
                    <Skeleton className="h-6 w-full"/>
                    <Skeleton className="h-6 w-5/6"/>
                    <Skeleton className="h-6 w-full"/>
                </div>
            </div>
        )
    }

    if (!template) {
        return <div className="p-8 text-center text-red-500">No se pudo encontrar la plantilla.</div>;
    }

    return (
        <div className="bg-white text-black p-6 printable-content max-w-3xl mx-auto">
            <header className="flex justify-between items-start mb-4 pb-4 border-b border-gray-300">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="font-bold text-lg">{companyInfo?.name || '[Nombre de la Empresa]'}</h2>
                        <p className="text-xs">{companyInfo?.slogan || '[Eslogan de la Empresa]'}</p>
                        <p className="text-xs">{companyInfo?.address || '[Dirección]'}</p>
                    </div>
                </div>
                <div className="text-right">
                     <h1 className="text-2xl font-headline font-bold text-primary">{template.name}</h1>
                </div>
            </header>
            
            <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-base">Folio Nº: [XXXXXX]</p>
                <p className="text-sm text-gray-600">Fecha de Emisión: {format(new Date(), "dd 'de' MMMM, yyyy", { locale: es })}</p>
            </div>

            <Card className="mb-4 shadow-none border-black bg-transparent">
                <CardHeader className="p-4">
                    <CardTitle className="text-xl">Información de la Orden de Trabajo</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                     <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <div><strong>Nº OT:</strong> [OT-0000]</div>
                        <div><strong>Cliente:</strong> [Nombre del Cliente]</div>
                        <div className="col-span-2"><strong>Descripción:</strong> [Descripción del trabajo a realizar]</div>
                        <div><strong>Técnico:</strong> [Nombre del Técnico]</div>
                        <div><strong>Fecha de Servicio:</strong> {format(new Date(), 'dd/MM/yyyy')}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-none border-black bg-transparent">
                <CardHeader className="p-4">
                    <CardTitle className="text-xl">Detalles del Servicio Realizado</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    {template.fields.sort((a,b) => (a.id > b.id ? 1 : -1)).map(field => {
                        if (field.type === 'checkbox') {
                            return <ReportCheckboxField key={field.id} label={field.label} checked={!!getPlaceholderValue(field)} />
                        }
                        return <ReportField key={field.id} label={field.label} value={getPlaceholderValue(field)} />
                    })}
                </CardContent>
            </Card>

            <footer className="mt-12 pt-8 border-t-2 border-dashed border-gray-400">
                <div className="grid grid-cols-2 gap-8 text-center text-sm">
                     <div className="flex flex-col justify-between">
                         <div>
                            <p className="mb-12 border-b border-black w-full"></p>
                            <p><strong>Firma Cliente</strong></p>
                            <p>[Nombre de quien recibe]</p>
                            <p>[RUT de quien recibe]</p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                           <p className="mb-12 border-b border-black w-full"></p>
                           <p><strong>Firma Técnico</strong></p>
                           <p>[Nombre del Técnico]</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
