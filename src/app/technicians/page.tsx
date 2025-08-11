import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function TechniciansPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-headline font-bold tracking-tight">
                    Técnicos
                </h1>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Técnico
                </Button>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center">
                <p className="text-muted-foreground">La tabla de Técnicos se mostrará aquí.</p>
            </div>
        </div>
    );
}
