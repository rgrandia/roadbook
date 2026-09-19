"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DIRECTION_LABELS, DIRECTION_ORDER } from "@/lib/roadbook/direction-icons";
import type { DirectionType } from "@/lib/roadbook/types";
import { cn } from "@/lib/utils";
import { DirectionIcon } from "./direction-icon";

export function DirectionPicker({
  value,
  onChange,
  className,
}: {
  value: DirectionType;
  onChange: (direction: DirectionType) => void;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
            className,
          )}
          title={DIRECTION_LABELS[value]}
        >
          <DirectionIcon direction={value} size={18} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="grid grid-cols-5 gap-1">
          {DIRECTION_ORDER.map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => onChange(direction)}
              title={DIRECTION_LABELS[direction]}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md border text-slate-700 hover:bg-slate-50",
                direction === value ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200",
              )}
            >
              <DirectionIcon direction={direction} size={20} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
