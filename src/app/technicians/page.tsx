
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useWorkOrders } from '@/context/work-orders-context';
import TechniciansTable from '@/components/technicians/technicians-table';
import Link from 'next/link';

export default function TechniciansPage() {
    const { technicians } = useWorkOrders();

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Técnicos
                </h1>
                <Button asChild>
                    <Link href="/technicians/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nuevo Técnico
                    </Link>
                </Button>
            </div>
            
            <TechniciansTable technicians={technicians} />
        </div>
    );
}
