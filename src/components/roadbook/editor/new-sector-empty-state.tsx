"use client";

import { Plus, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoadbookStore } from "@/store/roadbook-store";

export function NewSectorEmptyState({ stageId }: { stageId?: string }) {
  const addStage = useRoadbookStore((s) => s.addStage);
  const addSector = useRoadbookStore((s) => s.addSector);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Route className="h-7 w-7" />
      </div>
      <p className="text-sm text-slate-500">
        {stageId ? "Aquesta etapa encara no té cap sector." : "Encara no hi ha cap etapa."}
      </p>
      <Button
        variant="primary"
        onClick={() => {
          const targetStage = stageId ?? addStage();
          addSector(targetStage);
        }}
      >
        <Plus className="h-4 w-4" />
        Afegir sector
      </Button>
    </div>
  );
}
