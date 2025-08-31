
'use client';

// Este componente ahora es puramente visual y no depende de datos de Firestore.
export default function BrandDescription() {
    return (
        <div className="text-center">
            <h1 className="text-4xl font-headline font-bold tracking-tight text-primary">
                TechFlow
            </h1>
            <p className="mt-2 text-md text-muted-foreground">
                Flujo de Trabajo Tecnológico Inteligente.
            </p>
        </div>
    )
}
