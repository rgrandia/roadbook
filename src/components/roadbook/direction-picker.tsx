"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDb } from "@/lib/db";
import { DIRECTION_GROUPS, DIRECTION_LABELS, buildCustomGlyph, resolveDirectionGlyph } from "@/lib/roadbook/direction-icons";
import type { DirectionType } from "@/lib/roadbook/types";
import { cn } from "@/lib/utils";
import { DirectionIcon } from "./direction-icon";
import { IconDesignerDialog } from "./icon-designer-dialog";

export function DirectionPicker({
  value,
  customIconId,
  onChange,
  className,
}: {
  value: DirectionType;
  customIconId?: string;
  onChange: (direction: DirectionType, customIconId?: string) => void;
  className?: string;
}) {
  const [designerOpen, setDesignerOpen] = useState(false);
  const customIcons = useLiveQuery(() => getDb().customIcons.orderBy("createdAt").toArray(), []) ?? [];

  const currentGlyph = resolveDirectionGlyph(value, customIconId, customIcons);
  const currentCustom = value === "custom" ? customIcons.find((c) => c.id === customIconId) : undefined;
  const currentLabel = value === "custom" ? (currentCustom?.name ?? DIRECTION_LABELS.custom) : DIRECTION_LABELS[value];

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
              className,
            )}
            title={currentLabel}
          >
            <DirectionIcon direction={value} glyph={currentGlyph} label={currentLabel} size={30} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 max-h-96 overflow-y-auto">
          <div className="flex flex-col gap-2.5">
            {DIRECTION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {group.label}
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {group.directions.map((direction) => (
                    <button
                      key={direction}
                      type="button"
                      onClick={() => onChange(direction, undefined)}
                      title={DIRECTION_LABELS[direction]}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-md border text-slate-700 hover:bg-slate-50",
                        direction === value && !customIconId
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-slate-200",
                      )}
                    >
                      <DirectionIcon direction={direction} size={30} />
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Les meves icones
              </p>
              <div className="grid grid-cols-5 gap-1">
                {customIcons.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    onClick={() => onChange("custom", icon.id)}
                    title={icon.name}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-md border text-slate-700 hover:bg-slate-50",
                      value === "custom" && customIconId === icon.id
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-slate-200",
                    )}
                  >
                    <DirectionIcon direction="custom" glyph={buildCustomGlyph(icon)} label={icon.name} size={30} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDesignerOpen(true)}
                  title="Crea una icona nova"
                  className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <IconDesignerDialog
        open={designerOpen}
        onOpenChange={setDesignerOpen}
        onSaved={(icon) => {
          onChange("custom", icon.id);
          setDesignerOpen(false);
        }}
      />
    </>
  );
}
