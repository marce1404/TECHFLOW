

'use client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubmittedReport, ReportTemplate } from '@/lib/types';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';
import BrandDescription from '@/components/layout/brand-description';
import { useParams } from 'next/navigation';

async function getReportForPrint(reportId: string): Promise<{ report: SubmittedReport; template: ReportTemplate } | null> {
  try {
    const reportRef = doc(db, 'submitted-reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      console.log("No such report document!");
      return null;
    }

    const report = { id: reportSnap.id, ...reportSnap.data() } as SubmittedReport;

    const templateRef = doc(db, 'report-templates', report.templateId);
    const templateSnap = await getDoc(templateRef);

    if (!templateSnap.exists()) {
      console.log("No such template document!");
      return null;
    }
    
    const template = { id: templateSnap.id, ...templateSnap.data() } as ReportTemplate;
    
    return { report, template };

  } catch (error) {
    console.error("Error getting documents for print:", error);
    return null;
  }
}

function PrintReportContent({ report, template }: { report: SubmittedReport; template: ReportTemplate }) {
    React.useEffect(() => {
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);
    
    const submittedDate = report.submittedAt?.toDate ? format(report.submittedAt.toDate(), "dd 'de' MMMM, yyyy", { locale: es }) : 'Fecha no disponible';

    const paymentStatusFields = template.fields.filter(f => ['valor_pendiente', 'valor_cancelado', 'en_garantia', 'cargo_automatico'].includes(f.name));

    return (
        <div className="bg-white text-black p-8 printable-content">
            <header className="flex justify-between items-start mb-8">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold font-headline">{template.name}</h1>
                    <p className="text-sm text-gray-500">Folio: {report.id}</p>
                </div>
                <div className="w-48">
                    <BrandDescription />
                </div>
            </header>
            
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Información de la Orden de Trabajo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Nº OT:</strong> {report.otDetails.ot_number}</div>
                        <div><strong>Cliente:</strong> {report.otDetails.client}</div>
                        <div className="col-span-2"><strong>Descripción:</strong> {report.otDetails.description}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Detalles del Servicio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {template.fields.filter(f => !paymentStatusFields.map(psf => psf.name).includes(f.name)).map(field => {
                        const value = report.reportData[field.name];
                        if (value === undefined || value === null || value === '') return null;

                        return (
                            <div key={field.id} className="text-sm">
                                <p className="font-semibold">{field.label}</p>
                                {field.type === 'checkbox' ? (
                                    <div className="flex items-center gap-2">
                                        {value ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                        <span>{value ? 'Sí' : 'No'}</span>
                                    </div>
                                ) : (
                                    <p className="text-gray-700 whitespace-pre-wrap">{String(value)}</p>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <div className="mt-8 grid grid-cols-2 gap-8 text-sm">
                {paymentStatusFields.length > 0 && (
                    <div className="space-y-1">
                        <p className="font-semibold">Estado de Pago:</p>
                        <div className="flex flex-col gap-1">
                            {paymentStatusFields.map(field => (
                                <div key={field.id} className="flex items-center gap-2">
                                    {report.reportData[field.name] ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                    <span>{field.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                 <div className="space-y-1">
                    <p className="font-semibold">Valor Servicio (Neto):</p>
                    <p>${new Intl.NumberFormat('es-CL').format(report.otDetails.netPrice || 0)}</p>
                </div>
            </div>

            <footer className="mt-16 pt-8 border-t-2 border-dashed">
                <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="flex flex-col justify-between">
                         <div>
                            <p className="mb-12">..................................................................</p>
                            <p><strong>Firma Cliente:</strong> {report.reportData.client_name_signature || 'N/A'}</p>
                        </div>
                        <p><strong>Fecha de Emisión:</strong> {submittedDate}</p>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                            <p className="mb-12">..................................................................</p>
                            <p><strong>Firma Técnico:</strong> {report.reportData.technician_signature || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}


export default function PrintReportPage() {
    const params = useParams();
    const reportId = params.id as string;
    const [data, setData] = React.useState<{ report: SubmittedReport; template: ReportTemplate } | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        if (!reportId) return;

        async function fetchReport() {
            try {
                const result = await getReportForPrint(reportId);
                if (result) {
                    setData(result);
                } else {
                    setError('No se pudo encontrar el informe o su plantilla asociada.');
                }
            } catch (err) {
                setError('Ocurrió un error al cargar los datos del informe.');
            } finally {
                setLoading(false);
            }
        }
        fetchReport();
    }, [reportId]);

    if (loading) {
        return <div className="p-8 text-center">Cargando informe para imprimir...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!data) {
        return <div className="p-8 text-center">No hay datos para mostrar.</div>;
    }

    return <PrintReportContent report={data.report} template={data.template} />;
}
