"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatKm, formatMinutes, sectorEstimatedTimeMinutes, sectorTotalDistance } from "@/lib/roadbook/calc";
import type { Sector, SectorType } from "@/lib/roadbook/types";
import { validateSector } from "@/lib/roadbook/validation";
import { useRoadbookStore } from "@/store/roadbook-store";
import { InstructionTable } from "./instruction-table";
import { QuickAddToolbar } from "./quick-add-toolbar";

const SECTOR_TYPE_LABELS: Record<SectorType, string> = {
  special: "Tram cronometrat",
  liaison: "Enllaç",
  "super-special": "Supertram",
  shakedown: "Shakedown",
  neutralized: "Neutralitzat",
  other: "Altre",
};

const SPEED_PRESETS = [35, 40, 50, 60];

export function SectorPanel({ stageId, sector }: { stageId: string; sector: Sector }) {
  const stage = useRoadbookStore((s) => s.roadbook?.stages.find((st) => st.id === stageId));
  const updateSectorMeta = useRoadbookStore((s) => s.updateSectorMeta);
  const addInstruction = useRoadbookStore((s) => s.addInstruction);
  const recalcAllKm = useRoadbookStore((s) => s.recalcAllKm);

  if (!stage) return null;

  const warnings = validateSector(stage, sector);
  const totalDistance = sectorTotalDistance(sector);
  const estimatedMinutes = sectorEstimatedTimeMinutes(sector);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label>Nom del sector</Label>
            <Input
              className="w-56"
              value={sector.name}
              onChange={(e) => updateSectorMeta(stageId, sector.id, { name: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Secció</Label>
            <Input
              className="w-32"
              placeholder="Opcional"
              value={sector.sectionLabel ?? ""}
              onChange={(e) => updateSectorMeta(stageId, sector.id, { sectionLabel: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Tipus de tram</Label>
            <Select
              className="w-40"
              value={sector.sectorType}
              onChange={(e) => updateSectorMeta(stageId, sector.id, { sectorType: e.target.value as SectorType })}
            >
              {Object.entries(SECTOR_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label>Població inici</Label>
            <Input
              className="w-40"
              value={sector.startLocation ?? ""}
              onChange={(e) => updateSectorMeta(stageId, sector.id, { startLocation: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Població final</Label>
            <Input
              className="w-40"
              value={sector.endLocation ?? ""}
              onChange={(e) => updateSectorMeta(stageId, sector.id, { endLocation: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Km inicial</Label>
            <Input
              type="number"
              step={0.01}
              className="w-24"
              value={sector.startKm}
              onChange={(e) => updateSectorMeta(stageId, sector.id, { startKm: Number(e.target.value) })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Velocitat mitjana</Label>
            <Select
              className="w-36"
              value={sector.averageSpeedKmh ? String(sector.averageSpeedKmh) : ""}
              onChange={(e) =>
                updateSectorMeta(stageId, sector.id, {
                  averageSpeedKmh: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            >
              <option value="">Manual</option>
              {SPEED_PRESETS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed} km/h
                </option>
              ))}
            </Select>
          </div>

          <div className="ml-auto flex items-end gap-3 text-right">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Distància</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{formatKm(totalDistance)} km</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Temps estimat</p>
              <p className="text-lg font-semibold tabular-nums text-slate-900">{formatMinutes(estimatedMinutes)}</p>
            </div>
            <Button variant="outline" size="sm" onClick={recalcAllKm} title="Recalcula tot el quilometratge">
              <RefreshCw className="h-3.5 w-3.5" /> Recalcula
            </Button>
          </div>
        </div>

        <div>
          <Label>Observacions del sector</Label>
          <Textarea
            className="mt-1"
            rows={1}
            value={sector.notes ?? ""}
            onChange={(e) => updateSectorMeta(stageId, sector.id, { notes: e.target.value })}
            placeholder="Notes generals del sector (opcional)"
          />
        </div>

        {warnings.length > 0 && (
          <div className="flex flex-col gap-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
            {warnings.map((w) => (
              <div key={w.id} className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {w.message}
              </div>
            ))}
          </div>
        )}
      </div>

      <QuickAddToolbar onAdd={(preset) => addInstruction(stageId, sector.id, undefined, preset)} />

      <div className="flex-1 overflow-auto">
        <div className="min-w-[880px]">
          <InstructionTable stageId={stageId} sector={sector} />
        </div>
      </div>
    </div>
  );
}
