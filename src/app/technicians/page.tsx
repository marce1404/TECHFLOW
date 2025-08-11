
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useWorkOrders } from '@/context/work-orders-context';
import type { Technician } from '@/lib/types';
import { TechnicianFormDialog } from '@/components/technicians/technician-form-dialog';
import TechniciansTable from '@/components/technicians/technicians-table';

export default function TechniciansPage() {
    const { technicians, addTechnician, updateTechnician } = useWorkOrders();
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [selectedTechnician, setSelectedTechnician] = React.useState<Technician | null>(null);

    const handleSave = (technician: Omit<Technician, 'id'> | Technician) => {
        if ('id' in technician) {
            updateTechnician(technician.id, technician);
        } else {
            addTechnician(technician);
        }
    };

    const handleEdit = (technician: Technician) => {
        setSelectedTechnician(technician);
        setDialogOpen(true);
    };
    
    const handleAddNew = () => {
        setSelectedTechnician(null);
        setDialogOpen(true);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Técnicos
                </h1>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Técnico
                </Button>
            </div>
            
            <TechniciansTable technicians={technicians} onEdit={handleEdit} />

            <TechnicianFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                technician={selectedTechnician}
            />
        </div>
    );
}
