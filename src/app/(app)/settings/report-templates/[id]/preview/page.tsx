
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
                if (field.name === 'equipamiento_utilizado') return "6,Tarjeta ioprox,nueva\n2,Batería 12V,reemplazo";
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
    
    if (template.name === 'Informe Técnico de Control de Acceso') {
        const materials = String(getPlaceholderValue({name: 'equipamiento_utilizado', type: 'textarea', id:'test', label: '', required: false}) || '').split('\n').map(line => {
            const parts = line.split(',');
            return {
                cantidad: parts[0] || '',
                descripcion: parts[1] || '',
                observacion: parts[2] || '',
            }
        });

        return (
            <div className="bg-white text-black p-8 printable-content max-w-4xl mx-auto font-sans">
                <header className="text-center mb-6">
                    <h1 className="text-xl font-bold">INFORME TÉCNICO</h1>
                    <h2 className="text-lg font-bold">CONTROL DE ACCESO CMDIC</h2>
                </header>
                
                <table className="w-full border-collapse border border-gray-400 mb-4 text-sm">
                    <tbody>
                        <tr>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold w-1/6">Fecha</td>
                            <td className="border border-gray-400 p-2 w-1/3">{format(new Date(), 'dd/MM/yyyy')}</td>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold w-1/6">Técnico</td>
                            <td className="border border-gray-400 p-2">[Nombre del Técnico]</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Tag/Nombre</td>
                            <td className="border border-gray-400 p-2">[Sala de Cambio]</td>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Supervisor</td>
                            <td className="border border-gray-400 p-2">[Nombre del Supervisor]</td>
                        </tr>
                         <tr>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Área</td>
                            <td colSpan={3} className="border border-gray-400 p-2">[Concentradora]</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Ubicación de unidad</td>
                            <td colSpan={3} className="border border-gray-400 p-2">[Ubicación detallada de la unidad]</td>
                        </tr>
                    </tbody>
                </table>
                
                <div className="mb-4 text-sm">
                    <div className="p-2 border border-gray-400 bg-blue-100 font-bold rounded-t-md">Requerimiento</div>
                    <div className="p-2 border border-gray-400 border-t-0 rounded-b-md">[Mantenimiento preventivo y correctivo del sistema de control de acceso.]</div>
                </div>

                <div className="mb-4 text-sm">
                    <div className="p-2 border border-gray-400 bg-blue-100 font-bold rounded-t-md">Servicios / actividades realizadas</div>
                    <div className="p-2 border border-gray-400 border-t-0 rounded-b-md">[Se realiza una inspección completa del sistema control de acceso y de funciones generales.]</div>
                </div>

                <div className="mb-4 text-sm">
                    <div className="p-2 border border-gray-400 bg-blue-100 font-bold rounded-t-md">Equipamiento / material utilizado</div>
                    <div className="border border-gray-400 border-t-0 rounded-b-md">
                        <table className="w-full">
                           <thead>
                                <tr>
                                    <th className="p-2 border-b border-r border-gray-400 w-1/6">Cantidad</th>
                                    <th className="p-2 border-b border-r border-gray-400 w-2/3">Descripción</th>
                                    <th className="p-2 border-b border-gray-400">Observación</th>
                                </tr>
                           </thead>
                           <tbody>
                            {materials.map((mat, idx) => (
                                <tr key={idx}>
                                    <td className="p-2 border-r border-gray-400">{mat.cantidad}</td>
                                    <td className="p-2 border-r border-gray-400">{mat.descripcion}</td>
                                    <td className="p-2">{mat.observacion}</td>
                                </tr>
                            ))}
                            {[...Array(Math.max(0, 10 - materials.length))].map((_, i) => (
                                <tr key={`empty-${i}`}><td className="p-2 border-r border-gray-400 h-8"></td><td className="p-2 border-r border-gray-400"></td><td className="p-2"></td></tr>
                            ))}
                           </tbody>
                        </table>
                    </div>
                </div>

                <div className="mb-6 text-sm">
                    <div className="p-2 border border-gray-400 bg-blue-100 font-bold rounded-t-md">Observaciones</div>
                    <div className="p-2 border border-gray-400 border-t-0 rounded-b-md">
                        <ul className="list-disc pl-5">
                           <li>[Observación de ejemplo 1.]</li>
                           <li>[Observación de ejemplo 2.]</li>
                           <li>[Observación de ejemplo 3.]</li>
                        </ul>
                    </div>
                </div>

                <footer className="grid grid-cols-2 gap-8 pt-8">
                     <div className="text-center">
                        <p className="font-bold mb-2">OSESA</p>
                        <p className="border-b-2 border-black h-16 mb-2"></p>
                        <p>Nombre: [Nombre firma OSESA]</p>
                        <p>Firma:</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-2">CMDIC</p>
                        <p className="border-b-2 border-black h-16 mb-2"></p>
                        <p>Nombre: [Nombre firma Cliente]</p>
                        <p>Firma:</p>
                    </div>
                </footer>
            </div>
        );
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
