"use client";

import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoadbookStore } from "@/store/roadbook-store";

export function NewSectorEmptyState({ stageId }: { stageId?: string }) {
  const addStage = useRoadbookStore((s) => s.addStage);
  const addSector = useRoadbookStore((s) => s.addSector);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-slate-400">
      <Route className="h-10 w-10" />
      <p className="text-sm">{stageId ? "Aquesta etapa encara no té cap sector." : "Encara no hi ha cap etapa."}</p>
      <Button
        onClick={() => {
          const targetStage = stageId ?? addStage();
          addSector(targetStage);
        }}
      >
        + Afegir sector
      </Button>
    </div>
  );
}
