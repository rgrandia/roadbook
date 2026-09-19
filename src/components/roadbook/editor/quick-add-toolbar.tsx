"use client";

import {
  AlertTriangle,
  Building2,
  CircleParking as ParkingCircle,
  Flag,
  Info,
  MapPinCheck,
  NotebookPen,
  OctagonAlert,
  Users,
} from "lucide-react";
import { DirectionIcon } from "@/components/roadbook/direction-icon";
import { DIRECTION_LABELS, QUICK_DIRECTIONS } from "@/lib/roadbook/direction-icons";
import { CATEGORY_DEFS } from "@/lib/roadbook/library";
import type { Instruction, InstructionCategory } from "@/lib/roadbook/types";
import { cn } from "@/lib/utils";

export type QuickAddPreset = Partial<Pick<Instruction, "direction" | "category">>;

const CATEGORY_ICONS: Partial<Record<InstructionCategory, React.ComponentType<{ className?: string }>>> = {
  stop: OctagonAlert,
  regroup: Users,
  finish: Flag,
  start: MapPinCheck,
  control: MapPinCheck,
  population: Building2,
  info: Info,
  danger: AlertTriangle,
  note: NotebookPen,
};

const CATEGORY_BUTTONS: InstructionCategory[] = [
  "stop",
  "regroup",
  "control",
  "start",
  "finish",
  "population",
  "info",
  "danger",
  "note",
];

export function QuickAddToolbar({ onAdd }: { onAdd: (preset: QuickAddPreset) => void }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/60 p-3">
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Direcció</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DIRECTIONS.map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => onAdd({ direction, category: "normal" })}
              title={`Afegeix instrucció: ${DIRECTION_LABELS[direction]}`}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-red-300 hover:bg-red-50 hover:text-red-700"
            >
              <DirectionIcon direction={direction} size={18} />
              {DIRECTION_LABELS[direction]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Elements especials</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_BUTTONS.map((category) => {
            const def = CATEGORY_DEFS.find((c) => c.category === category)!;
            const Icon = CATEGORY_ICONS[category] ?? ParkingCircle;
            return (
              <button
                key={category}
                type="button"
                onClick={() => onAdd({ category, direction: category === "population" ? "straight" : "none" })}
                title={`Afegeix ${def.label}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-sm",
                  def.banner
                    ? `${def.accent} border-transparent text-white`
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {def.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
