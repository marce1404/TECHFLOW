

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
        <div className="text-sm border-b border-gray-300 py-1">
            <p className="font-bold text-gray-600">{label}</p>
            <p className="text-gray-800 whitespace-pre-wrap">{String(value)}</p>
        </div>
    );
};

const ReportFieldFull = ({ label, value }: { label: string; value: any }) => {
    if (value === undefined || value === null || value === '') return null;
    return (
        <div className="text-sm p-2 border border-gray-400 bg-gray-50 rounded-md">
            <p className="font-bold text-gray-600 mb-1">{label}</p>
            <div className="text-gray-800 whitespace-pre-wrap pl-2">
                {String(value).split('\n').map((line, index) => (
                    <p key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{line}</span>
                    </p>
                ))}
            </div>
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
    const getFieldValue = (fieldName: string) => report.reportData[fieldName];

    if (template.name === 'Informe Técnico de Control de Acceso') {
        const materials = String(getFieldValue('equipamiento_utilizado') || '').split('\n').map(line => {
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
                            <td className="border border-gray-400 p-2 w-1/3">{getFieldValue('fecha') ? format(new Date(getFieldValue('fecha').replace(/-/g, '/')), 'dd/MM/yyyy') : 'N/A'}</td>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold w-1/6">Técnico</td>
                            <td className="border border-gray-400 p-2 w-1/3">{getFieldValue('tecnico')}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Tag/Nombre</td>
                            <td className="border border-gray-400 p-2">{getFieldValue('tag_nombre')}</td>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Supervisor</td>
                            <td className="border border-gray-400 p-2">{getFieldValue('supervisor')}</td>
                        </tr>
                         <tr>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Área</td>
                            <td colSpan={3} className="border border-gray-400 p-2">{getFieldValue('area')}</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-400 p-2 bg-blue-100 font-bold">Ubicación de unidad</td>
                            <td colSpan={3} className="border border-gray-400 p-2">{getFieldValue('ubicacion_unidad')}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div className="mb-4 text-sm">
                    <div className="p-2 border border-gray-400 bg-blue-100 font-bold rounded-t-md">Requerimiento</div>
                    <div className="p-2 border border-gray-400 border-t-0 rounded-b-md">{getFieldValue('requerimiento')}</div>
                </div>

                <div className="mb-4 text-sm">
                    <div className="p-2 border border-gray-400 bg-blue-100 font-bold rounded-t-md">Servicios / actividades realizadas</div>
                    <div className="p-2 border border-gray-400 border-t-0 rounded-b-md">{getFieldValue('servicios_realizados')}</div>
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
                            {String(getFieldValue('observaciones') || '').split('\n').map((line, idx) => line.trim() && <li key={idx}>{line}</li>)}
                        </ul>
                    </div>
                </div>

                <footer className="grid grid-cols-2 gap-8 pt-8">
                     <div className="text-center">
                        <p className="font-bold mb-2">OSESA</p>
                        <p className="border-b-2 border-black h-16 mb-2"></p>
                        <p>Nombre: {getFieldValue('nombre_osesa')}</p>
                        <p>Firma:</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold mb-2">CMDIC</p>
                        <p className="border-b-2 border-black h-16 mb-2"></p>
                        <p>Nombre: {getFieldValue('nombre_cmdic')}</p>
                        <p>Firma:</p>
                    </div>
                </footer>
            </div>
        );
    }

    // Fallback for other templates
    return (
        <div className="bg-white text-black p-6 printable-content max-w-3xl mx-auto">
             <header className="flex justify-between items-start mb-4 pb-4 border-b border-gray-300">
                <div>
                    <h2 className="font-bold text-lg">{companyInfo?.name || 'TechFlow'}</h2>
                    <p className="text-xs">{companyInfo?.slogan || 'Soluciones Inteligentes'}</p>
                    <p className="text-xs">{companyInfo?.address || ''}</p>
                </div>
                <div className="text-right">
                     <h1 className="text-2xl font-headline font-bold text-primary">{template.name}</h1>
                </div>
            </header>
            <div className="space-y-4">
            {template.fields.map(field => <ReportField key={field.id} label={field.label} value={getFieldValue(field.name)} />)}
            </div>
        </div>
    );
}

