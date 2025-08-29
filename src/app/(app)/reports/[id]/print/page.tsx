

'use client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubmittedReport, ReportTemplate, CompanyInfo } from '@/lib/types';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';
import { useParams } from 'next/navigation';

async function getReportForPrint(reportId: string): Promise<{ report: SubmittedReport; template: ReportTemplate, companyInfo: CompanyInfo | null } | null> {
  try {
    const reportRef = doc(db, 'submitted-reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      console.log("No such report document!");
      return null;
    }

    const report = { id: reportSnap.id, ...reportSnap.data() } as SubmittedReport;

    if (!report.templateId) {
        console.error("Report is missing templateId");
        return null;
    }

    const templateRef = doc(db, 'report-templates', report.templateId);
    const templateSnap = await getDoc(templateRef);

    if (!templateSnap.exists()) {
      console.log("No such template document!");
      return null;
    }
    
    const template = { id: templateSnap.id, ...templateSnap.data() } as ReportTemplate;
    
    const companyInfoRef = doc(db, 'settings', 'companyInfo');
    const companyInfoSnap = await getDoc(companyInfoRef);
    const companyInfo = companyInfoSnap.exists() ? companyInfoSnap.data() as CompanyInfo : null;

    return { report, template, companyInfo };

  } catch (error) {
    console.error("Error getting documents for print:", error);
    return null;
  }
}

function PrintReportContent({ report, template, companyInfo }: { report: SubmittedReport; template: ReportTemplate; companyInfo: CompanyInfo | null }) {
    React.useEffect(() => {
        setTimeout(() => {
            window.print();
        }, 500);
    }, []);
    
    const submittedDate = report.submittedAt?.toDate ? format(report.submittedAt.toDate(), "dd 'de' MMMM, yyyy", { locale: es }) : 'Fecha no disponible';
    const shortFolio = report.id.substring(report.id.length - 6).toUpperCase();

    const paymentStatusFields = template.fields.filter(f => ['valor_pendiente', 'valor_cancelado', 'en_garantia', 'cargo_automatico'].includes(f.name));
    const mainFields = template.fields.filter(f => !paymentStatusFields.map(psf => psf.name).includes(f.name) && f.type !== 'checkbox');
    const checkboxFields = template.fields.filter(f => f.type === 'checkbox' && !paymentStatusFields.map(psf => psf.name).includes(f.name));

    return (
        <div className="bg-white text-black p-6 printable-content max-w-3xl mx-auto">
            <header className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-headline font-bold text-primary">{template.name}</h1>
                </div>
                <div className="text-right text-xs">
                    <h2 className="font-bold text-base">{companyInfo?.name || 'TechFlow'}</h2>
                    <p>{companyInfo?.slogan || 'Soluciones Inteligentes'}</p>
                    <p>{companyInfo?.address || ''}</p>
                </div>
            </header>
            
            <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-lg">Folio Nº: {shortFolio}</p>
                <p className="text-sm text-gray-600">Fecha de Emisión: {submittedDate}</p>
            </div>

            <Card className="mb-4 shadow-none border-black">
                <CardHeader className="p-4">
                    <CardTitle className="text-xl">Información de la Orden de Trabajo</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <div><strong>Nº OT:</strong> {report.otDetails.ot_number}</div>
                        <div><strong>Cliente:</strong> {report.otDetails.client}</div>
                        <div className="col-span-2"><strong>Descripción:</strong> {report.otDetails.description}</div>
                        <div><strong>Técnico:</strong> {report.reportData.technician_signature || 'N/A'}</div>
                        <div><strong>Fecha de Servicio:</strong> {report.reportData.service_date ? format(new Date(report.reportData.service_date.replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-none border-black">
                <CardHeader className="p-4">
                    <CardTitle className="text-xl">Detalles del Servicio Realizado</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                    {mainFields.filter(f => ['requirement', 'solution'].includes(f.name)).map(field => {
                         const value = report.reportData[field.name];
                         if (value === undefined || value === null || value === '') return null;
                         return (
                            <div key={field.id} className="text-sm">
                                <p className="font-bold text-base mb-1">{field.label}:</p>
                                <p className="text-gray-700 whitespace-pre-wrap pl-1">{String(value)}</p>
                            </div>
                         )
                    })}
                    <Separator className="my-3 bg-black"/>
                    {mainFields.filter(f => !['requirement', 'solution', 'technician_signature', 'service_date', 'client_name_signature', 'client_rut_signature'].includes(f.name)).map(field => {
                         const value = report.reportData[field.name];
                         if (value === undefined || value === null || value === '') return null;
                         return (
                            <div key={field.id} className="text-sm">
                                <p className="font-semibold">{field.label}:</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{String(value)}</p>
                            </div>
                         )
                    })}
                     {checkboxFields.length > 0 && (
                        <div className="space-y-1 pt-2">
                             {checkboxFields.map(field => (
                                <div key={field.id} className="flex items-center gap-2">
                                    {report.reportData[field.name] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                                    <span className="font-semibold text-sm">{field.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-4 grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                    <p className="font-semibold text-base">Estado de Pago:</p>
                    <div className="flex flex-col gap-1">
                        {paymentStatusFields.length > 0 ? paymentStatusFields.map(field => (
                            <div key={field.id} className="flex items-center gap-2">
                                {report.reportData[field.name] ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                                <span>{field.label}</span>
                            </div>
                        )) : <p>No definido.</p>}
                    </div>
                </div>
                 <div className="space-y-1 text-right">
                    <p className="font-semibold text-base">Valor Servicio (Neto):</p>
                    <p className="text-lg font-bold">${new Intl.NumberFormat('es-CL').format(report.otDetails.netPrice || 0)}</p>
                </div>
            </div>

            <footer className="mt-12 pt-4 border-t-2 border-dashed border-gray-400">
                <div className="grid grid-cols-2 gap-8 text-center text-sm">
                     <div className="flex flex-col justify-between">
                         <div>
                            <p className="mb-12 border-b border-black w-full"></p>
                            <p><strong>Firma Cliente</strong></p>
                            <p className="capitalize">{report.reportData.client_name_signature || 'N/A'}</p>
                            <p className="uppercase">{report.reportData.client_rut_signature || ''}</p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                           <p className="mb-12 border-b border-black w-full"></p>
                           <p><strong>Firma Técnico</strong></p>
                           <p className="capitalize">{report.reportData.technician_signature || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}


export default function PrintReportPage() {
    const params = useParams();
    const reportId = params ? params.id as string : '';
    const [data, setData] = React.useState<{ report: SubmittedReport; template: ReportTemplate; companyInfo: CompanyInfo | null } | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        if (!reportId) {
            setError('ID de informe no válido.');
            setLoading(false);
            return;
        };

        async function fetchReport() {
            try {
                const result = await getReportForPrint(reportId);
                if (result) {
                    setData(result);
                } else {
                    setError('No se pudo encontrar el informe o su plantilla asociada.');
                }
            } catch (err) {
                console.error(err);
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

    return <PrintReportContent report={data.report} template={data.template} companyInfo={data.companyInfo} />;
}
