
'use client';
import { useWorkOrders } from "@/context/work-orders-context";

export default function BrandDescription() {
    const { companyInfo } = useWorkOrders();
    return (
        <div className="text-center">
            <h1 className="text-4xl font-headline font-bold tracking-tight text-primary">
                {companyInfo?.name || 'TechFlow'}
            </h1>
            <p className="mt-2 text-md text-muted-foreground">
                {companyInfo?.slogan || 'Flujo de Trabajo Tecnológico Inteligente.'}
            </p>
        </div>
    )
}
