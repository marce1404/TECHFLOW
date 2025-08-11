
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWorkOrders } from '@/context/work-orders-context';
import type { CertificationItem, EPPItem, Technician, WorkClothingItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PrintTechnicianPage() {
  const params = useParams();
  const { technicians } = useWorkOrders();
  const technicianId = params.id as string;
  
  const [technician, setTechnician] = React.useState<Technician | undefined>(undefined);

  React.useEffect(() => {
    const foundTechnician = technicians.find(t => t.id === technicianId);
    setTechnician(foundTechnician);
  }, [technicianId, technicians]);

  React.useEffect(() => {
    if (technician) {
      setTimeout(() => window.print(), 500);
    }
  }, [technician]);


  if (!technician) {
    return <div>Cargando ficha del técnico...</div>;
  }
  
  const renderInfoTable = (title: string, data: [string, string | undefined][]) => (
    <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="border rounded-lg p-4 grid grid-cols-2 gap-4">
            {data.map(([label, value]) => (
                <div key={label}>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="font-medium">{value || 'N/A'}</p>
                </div>
            ))}
        </div>
    </div>
  );
  
  const renderItemsTable = (title: string, headers: string[], items: (WorkClothingItem | EPPItem | CertificationItem)[], renderRow: (item: any) => React.ReactNode) => (
    <Card>
        <CardHeader>
            <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length > 0 ? items.map((item) => renderRow(item)) : <TableRow><TableCell colSpan={headers.length} className="text-center">No hay registros.</TableCell></TableRow>}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );

  return (
    <div className="bg-white text-black p-8 md:p-12">
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="flex justify-between items-center pb-4 border-b">
                <div>
                     {/* Placeholder for company logo */}
                     <h1 className="text-2xl font-bold text-gray-800">APTECH</h1>
                     <p className="text-sm text-gray-500">Ficha de Entrega de Recursos</p>
                </div>
                <div className="no-print">
                    <Button onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                </div>
            </header>

            <main className="space-y-10">
                {renderInfoTable("Información del Técnico", [
                    ["Nombre Completo", technician.name],
                    ["Especialidad", technician.specialty],
                    ["Área", technician.area],
                    ["Estado", technician.status],
                    ["Licencia de Conducir", technician.license],
                ])}

                {renderItemsTable("Vestimenta de Trabajo", ["Item", "Talla", "Cantidad", "Fecha Entrega", "Fecha Caducidad"], technician.workClothing, (item: WorkClothingItem) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.deliveryDate}</TableCell>
                        <TableCell>{item.expirationDate}</TableCell>
                    </TableRow>
                ))}

                {renderItemsTable("Equipo de Protección Personal (EPP)", ["Item", "Talla", "Cantidad", "Fecha Entrega", "Fecha Caducidad"], technician.epp, (item: EPPItem) => (
                     <TableRow key={item.id}>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.size}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.deliveryDate}</TableCell>
                        <TableCell>{item.expirationDate}</TableCell>
                    </TableRow>
                ))}

                {renderItemsTable("Certificados", ["Nombre", "Organización Emisora", "Fecha Emisión", "Fecha Caducidad"], technician.certifications, (item: CertificationItem) => (
                    <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.issuingOrganization}</TableCell>
                        <TableCell>{item.issueDate}</TableCell>
                        <TableCell>{item.expirationDate}</TableCell>
                    </TableRow>
                ))}
            </main>

            <footer className="pt-12 text-center text-sm">
                <div className="grid grid-cols-2 gap-12 items-end">
                    <div>
                        <div className="border-t border-gray-400 pt-2 w-full max-w-xs mx-auto">
                            <p>Firma del Trabajador</p>
                            <p className="mt-1">Nombre: {technician.name}</p>
                            <p className="mt-1">RUT: _________________________</p>
                        </div>
                    </div>
                    <div>
                        <p>Fecha de Emisión: {new Date().toLocaleDateString('es-CL')}</p>
                    </div>
                </div>
                <p className="mt-12 text-gray-500">
                    Declaro haber recibido los elementos mencionados en esta ficha, comprometiéndome a su correcto uso y cuidado.
                </p>
            </footer>
        </div>
    </div>
  );
}
