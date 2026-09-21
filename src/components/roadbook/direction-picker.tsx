"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getDb } from "@/lib/db";
import { DIRECTION_GROUPS, DIRECTION_LABELS, buildCustomGlyph, resolveDirectionGlyph } from "@/lib/roadbook/direction-icons";
import type { CustomDirectionIcon, DirectionType } from "@/lib/roadbook/types";
import { cn } from "@/lib/utils";
import { DirectionIcon } from "./direction-icon";
import { IconDesignerDialog } from "./icon-designer-dialog";

function normalize(text: string): string {
  return text
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

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
  const [query, setQuery] = useState("");
  const customIcons = useLiveQuery(() => getDb().customIcons.orderBy("createdAt").toArray(), []) ?? [];

  const currentGlyph = resolveDirectionGlyph(value, customIconId, customIcons);
  const currentCustom = value === "custom" ? customIcons.find((c) => c.id === customIconId) : undefined;
  const currentLabel = value === "custom" ? (currentCustom?.name ?? DIRECTION_LABELS.custom) : DIRECTION_LABELS[value];

  const needle = normalize(query.trim());
  const filteredGroups = useMemo(() => {
    if (!needle) return DIRECTION_GROUPS;
    return DIRECTION_GROUPS.map((group) => ({
      ...group,
      directions: group.directions.filter((direction) => normalize(DIRECTION_LABELS[direction]).includes(needle)),
    })).filter((group) => group.directions.length > 0);
  }, [needle]);
  const filteredCustomIcons: CustomDirectionIcon[] = needle
    ? customIcons.filter((icon) => normalize(icon.name).includes(needle))
    : customIcons;
  const noResults = needle && filteredGroups.length === 0 && filteredCustomIcons.length === 0;

  return (
    <>
      <Popover onOpenChange={(nextOpen) => !nextOpen && setQuery("")}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50",
              className,
            )}
            title={currentLabel}
          >
            <DirectionIcon direction={value} glyph={currentGlyph} label={currentLabel} size={30} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 max-h-96 overflow-y-auto">
          <div className="sticky top-0 z-10 -mx-2 -mt-2 mb-2 bg-white px-2 pb-2 pt-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca una icona..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/20"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {noResults && <p className="px-0.5 text-xs text-slate-400">Cap icona coincideix amb &quot;{query}&quot;.</p>}

            {filteredGroups.map((group) => (
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
                        "flex h-12 w-12 items-center justify-center rounded-lg border text-slate-700 transition-colors hover:bg-slate-50",
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

            {(!needle || filteredCustomIcons.length > 0) && (
              <div>
                <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Les meves icones
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {filteredCustomIcons.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => onChange("custom", icon.id)}
                      title={icon.name}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg border text-slate-700 transition-colors hover:bg-slate-50",
                        value === "custom" && customIconId === icon.id
                          ? "border-red-500 bg-red-50 text-red-600"
                          : "border-slate-200",
                      )}
                    >
                      <DirectionIcon direction="custom" glyph={buildCustomGlyph(icon.template)} label={icon.name} size={30} />
                    </button>
                  ))}
                  {!needle && (
                    <button
                      type="button"
                      onClick={() => setDesignerOpen(true)}
                      title="Crea una icona nova"
                      className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
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
