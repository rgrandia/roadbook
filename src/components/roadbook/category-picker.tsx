"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_DEFS } from "@/lib/roadbook/library";
import type { InstructionCategory } from "@/lib/roadbook/types";
import { cn } from "@/lib/utils";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: InstructionCategory;
  onChange: (category: InstructionCategory) => void;
}) {
  const def = CATEGORY_DEFS.find((c) => c.category === value)!;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-[11px] font-semibold uppercase tracking-wide",
            def.category === "normal"
              ? "border-slate-200 bg-white text-slate-400"
              : `${def.accent} border-transparent ${def.banner ? "text-white" : "text-slate-700"}`,
          )}
        >
          {def.category === "normal" ? "—" : (def.code ?? def.label)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex flex-col gap-0.5">
          {CATEGORY_DEFS.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() => onChange(c.category)}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-slate-50",
                c.category === value && "bg-slate-100 font-medium",
              )}
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  c.accent,
                  c.category === "normal" && "border border-slate-300",
                )}
              />
              {c.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
