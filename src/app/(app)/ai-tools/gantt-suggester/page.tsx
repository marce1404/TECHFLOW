
import GanttTaskSuggester from "@/components/ai/gantt-task-suggester";

export default function GanttSuggesterPage() {
  return (
    <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
            <p className="text-muted-foreground">
                Describe tu proyecto para recibir una propuesta estructurada de tareas y fases para tu Carta Gantt.
            </p>
      </div>
      <GanttTaskSuggester />
    </div>
  );
}
