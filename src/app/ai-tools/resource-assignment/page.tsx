import ResourceSuggester from "@/components/ai/resource-suggester";

export default function ResourceAssignmentPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-bold tracking-tight">
            Asistente de Asignación de Recursos IA
        </h1>
        <p className="text-muted-foreground">
            Describe los requerimientos de la tarea para recibir sugerencias de técnicos y vehículos óptimos.
        </p>
      </div>
      <ResourceSuggester />
    </div>
  );
}
