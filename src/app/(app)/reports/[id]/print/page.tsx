

'use client';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubmittedReport, ReportTemplate, CompanyInfo } from '@/lib/types';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckSquare, Square } from 'lucide-react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

async function getReportForPrint(reportId: string): Promise<{ report: SubmittedReport; template: ReportTemplate, companyInfo: CompanyInfo | null } | null> {
  try {
    const reportRef = doc(db, 'submitted-reports', reportId);
    const reportSnap = await getDoc(reportRef);

    if (!reportSnap.exists()) {
      console.log("No such report document!");
      return null;
    }

    const reportData = reportSnap.data();
    const report = { 
        id: reportSnap.id, 
        ...reportData,
        submittedAt: reportData.submittedAt instanceof Timestamp ? reportData.submittedAt : new Timestamp(reportData.submittedAt.seconds, reportData.submittedAt.nanoseconds)
    } as SubmittedReport;

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
    
    React.useEffect(() => {
        if (!loading && data) {
             setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [loading, data]);

    if (loading) {
        return <div className="p-8 text-center">Cargando informe para imprimir...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!data) {
        return <div className="p-8 text-center">No hay datos para mostrar.</div>;
    }

    const { report, template, companyInfo } = data;
    const submittedDate = report.submittedAt?.toDate ? format(report.submittedAt.toDate(), "dd 'de' MMMM, yyyy", { locale: es }) : 'Fecha no disponible';
    const shortFolio = report.id.substring(report.id.length - 6).toUpperCase();

    const getFieldValue = (fieldName: string) => report.reportData[fieldName];

    return (
        <div className="bg-white text-black p-6 printable-content max-w-3xl mx-auto">
            <header className="flex justify-between items-start mb-4 pb-4 border-b border-gray-300">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="font-bold text-lg">{companyInfo?.name || 'TechFlow'}</h2>
                        <p className="text-xs">{companyInfo?.slogan || 'Soluciones Inteligentes'}</p>
                        <p className="text-xs">{companyInfo?.address || ''}</p>
                    </div>
                </div>
                <div className="text-right">
                     <h1 className="text-2xl font-headline font-bold text-primary">{template.name}</h1>
                </div>
            </header>
            
            <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-base">Folio Nº: {shortFolio}</p>
                <p className="text-sm text-gray-600">Fecha de Emisión: {submittedDate}</p>
            </div>

            <Card className="mb-4 shadow-none border-black bg-transparent">
                <CardHeader className="p-4">
                    <CardTitle className="text-xl">Información de la Orden de Trabajo</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                     <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        <div><strong>Nº OT:</strong> {report.otDetails.ot_number}</div>
                        <div><strong>Cliente:</strong> {report.otDetails.client}</div>
                        <div className="col-span-2"><strong>Descripción:</strong> {report.otDetails.description}</div>
                        <div><strong>Técnico:</strong> {getFieldValue('tecnico') || getFieldValue('technician_signature') || 'N/A'}</div>
                        <div><strong>Fecha de Servicio:</strong> {getFieldValue('fecha') || getFieldValue('service_date') ? format(new Date((getFieldValue('fecha') || getFieldValue('service_date')).replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</div>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-none border-black bg-transparent">
                <CardHeader className="p-4">
                    <CardTitle className="text-xl">Detalles del Servicio Realizado</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                    <ReportField label="Requerimiento" value={getFieldValue('requerimiento') || getFieldValue('requirement')} />
                    <ReportField label="Servicios / Actividades Realizadas" value={getFieldValue('servicios_realizados') || getFieldValue('solution')} />
                    <ReportField label="Equipamiento / Material Utilizado" value={getFieldValue('equipamiento_utilizado') || getFieldValue('materials_used')} />
                    <ReportField label="Observaciones" value={getFieldValue('observaciones') || getFieldValue('tech_recommendations')} />
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <ReportCheckboxField label="¿Sistema queda operativo?" checked={!!getFieldValue('system_operative')} />
                        <ReportCheckboxField label="Cliente Conforme" checked={!!getFieldValue('client_conformity')} />
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                    <p className="font-semibold text-base">Estado de Pago:</p>
                    <div className="flex flex-col gap-1">
                        <ReportCheckboxField label="Valor pendiente" checked={!!getFieldValue('valor_pendiente')} />
                        <ReportCheckboxField label="Valor cancelado" checked={!!getFieldValue('valor_cancelado')} />
                        <ReportCheckboxField label="En garantía" checked={!!getFieldValue('en_garantia')} />
                        <ReportCheckboxField label="Cargo Automático" checked={!!getFieldValue('cargo_automatico')} />
                    </div>
                </div>
                 <div className="space-y-1 text-right">
                    <p className="font-semibold text-base">Valor Servicio (Neto):</p>
                    <p className="text-lg font-bold">${new Intl.NumberFormat('es-CL').format(report.otDetails.netPrice || 0)}</p>
                </div>
            </div>

            <footer className="mt-12 pt-8 border-t-2 border-dashed border-gray-400">
                <div className="grid grid-cols-2 gap-8 text-center text-sm">
                     <div className="flex flex-col justify-between">
                         <div>
                            <p className="mb-12 border-b border-black w-full"></p>
                            <p><strong>Firma Cliente</strong></p>
                            <p className="capitalize">{getFieldValue('nombre_cmdic') || getFieldValue('client_name_signature') || 'N/A'}</p>
                            <p className="uppercase">{getFieldValue('client_rut_signature') || ''}</p>
                        </div>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                           <p className="mb-12 border-b border-black w-full"></p>
                           <p><strong>Firma Técnico</strong></p>
                           <p className="capitalize">{getFieldValue('nombre_osesa') || getFieldValue('technician_signature') || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

