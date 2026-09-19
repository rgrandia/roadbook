"use client";

import { useEffect, useRef } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CategoryPicker } from "@/components/roadbook/category-picker";
import { DirectionPicker } from "@/components/roadbook/direction-picker";
import { CATEGORY_MAP, INFO_CHIPS, collectRoadbookDictionary } from "@/lib/roadbook/library";
import type { Instruction, Sector } from "@/lib/roadbook/types";
import { cn } from "@/lib/utils";
import { useRoadbookStore } from "@/store/roadbook-store";

const GRID_COLS = "28px 26px 84px 44px 76px 76px 70px 190px 150px 1fr 32px";

export function InstructionTable({ stageId, sector }: { stageId: string; sector: Sector }) {
  const roadbook = useRoadbookStore((s) => s.roadbook);
  const addInstruction = useRoadbookStore((s) => s.addInstruction);
  const updateInstruction = useRoadbookStore((s) => s.updateInstruction);
  const deleteInstruction = useRoadbookStore((s) => s.deleteInstruction);
  const duplicateInstruction = useRoadbookStore((s) => s.duplicateInstruction);
  const reorderInstructions = useRoadbookStore((s) => s.reorderInstructions);

  const rowRefs = useRef(new Map<string, HTMLInputElement>());
  const focusTarget = useRef<string | null>(null);

  useEffect(() => {
    if (!focusTarget.current) return;
    const el = rowRefs.current.get(focusTarget.current);
    if (el) {
      el.focus();
      el.select();
      focusTarget.current = null;
    }
  }, [sector.instructions]);

  const dictionary = collectRoadbookDictionary(roadbook);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleAppend(preset?: Partial<Instruction>, afterId?: string) {
    const newId = addInstruction(stageId, sector.id, afterId ?? null, preset);
    if (newId) focusTarget.current = newId;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sector.instructions.map((i) => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, String(active.id));
    reorderInstructions(stageId, sector.id, reordered);
  }

  function handleDelete(instructionId: string) {
    deleteInstruction(stageId, sector.id, instructionId);
    toast("Instrucció eliminada", { description: "Ctrl+Z per desfer" });
  }

  function handleDuplicate(instructionId: string) {
    const newId = duplicateInstruction(stageId, sector.id, instructionId);
    if (newId) focusTarget.current = newId;
  }

  return (
    <div className="flex flex-col">
      <datalist id="dl-roads">
        {dictionary.roads.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      <datalist id="dl-destinations">
        {dictionary.destinations.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
      <datalist id="dl-information">
        {[...INFO_CHIPS, ...dictionary.information].map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>

      <div
        className="grid items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        <span />
        <span>Nº</span>
        <span>Tipus</span>
        <span>Dir.</span>
        <span>Dist.</span>
        <span>Km total</span>
        <span>Km parc.</span>
        <span>Carretera</span>
        <span>Destinació</span>
        <span>Informació</span>
        <span />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sector.instructions.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div>
            {sector.instructions.map((instruction) => (
              <InstructionRow
                key={instruction.id}
                instruction={instruction}
                registerRef={(el) => {
                  if (el) rowRefs.current.set(instruction.id, el);
                  else rowRefs.current.delete(instruction.id);
                }}
                onChange={(partial) => updateInstruction(stageId, sector.id, instruction.id, partial)}
                onEnter={() => handleAppend(undefined, instruction.id)}
                onDuplicate={() => handleDuplicate(instruction.id)}
                onDelete={() => handleDelete(instruction.id)}
                onInsertBefore={() => {
                  const idx = sector.instructions.findIndex((i) => i.id === instruction.id);
                  const prevId = idx > 0 ? sector.instructions[idx - 1].id : undefined;
                  handleAppend(undefined, prevId);
                }}
                onInsertAfter={() => handleAppend(undefined, instruction.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sector.instructions.length === 0 && (
        <p className="px-3 py-8 text-center text-sm text-slate-400">
          Encara no hi ha instruccions. Fes servir la barra superior o el botó de sota per començar.
        </p>
      )}

      <button
        type="button"
        onClick={() => handleAppend()}
        className="m-3 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 hover:border-red-300 hover:text-red-600"
      >
        <Plus className="h-4 w-4" /> Afegir instrucció
      </button>
    </div>
  );
}

interface InstructionRowProps {
  instruction: Instruction;
  registerRef: (el: HTMLInputElement | null) => void;
  onChange: (partial: Partial<Instruction>) => void;
  onEnter: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
}

function InstructionRow({
  instruction,
  registerRef,
  onChange,
  onEnter,
  onDuplicate,
  onDelete,
  onInsertBefore,
  onInsertAfter,
}: InstructionRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instruction.id });
  const categoryDef = CATEGORY_MAP[instruction.category];

  function handleRowKeyDown(e: React.KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT") {
        e.preventDefault();
        onEnter();
      }
    } else if (mod && e.key.toLowerCase() === "d") {
      e.preventDefault();
      onDuplicate();
    } else if (mod && e.key === "Backspace") {
      e.preventDefault();
      onDelete();
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, gridTemplateColumns: GRID_COLS }}
      onKeyDown={handleRowKeyDown}
      className={cn(
        "group grid items-center gap-1.5 border-b border-slate-100 px-3 py-1.5 text-sm",
        instruction.category !== "normal" && !categoryDef.banner && "bg-slate-50/70",
        isDragging && "relative z-10 opacity-70 shadow-lg",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-slate-300 hover:text-slate-500"
        {...attributes}
        {...listeners}
        aria-label="Arrossega la instrucció"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <span className="text-center text-xs font-medium text-slate-400">{instruction.order}</span>

      <CategoryPicker value={instruction.category} onChange={(category) => onChange({ category })} />

      <DirectionPicker value={instruction.direction} onChange={(direction) => onChange({ direction })} />

      <Input
        ref={registerRef}
        type="number"
        step={0.01}
        inputMode="decimal"
        data-testid="distance-input"
        className="h-9 px-1.5 text-right tabular-nums"
        value={instruction.distance}
        onChange={(e) => onChange({ distance: Number(e.target.value) })}
        onFocus={(e) => e.currentTarget.select()}
      />

      <div className="relative">
        <Input
          type="number"
          step={0.01}
          className={cn("h-9 px-1.5 text-right tabular-nums", instruction.lockedKm && "border-amber-300 bg-amber-50")}
          value={instruction.totalKm}
          onChange={(e) => onChange({ totalKm: Number(e.target.value) })}
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <span className="text-right text-xs tabular-nums text-slate-400">{instruction.partialKm.toFixed(2)}</span>

      <div className="flex gap-1">
        <Input
          placeholder="Núm."
          list="dl-roads"
          className="h-9 w-16 px-1.5 text-xs"
          value={instruction.road.number ?? ""}
          onChange={(e) => onChange({ road: { ...instruction.road, number: e.target.value } })}
        />
        <Input
          placeholder="Carretera"
          list="dl-roads"
          className="h-9 flex-1 px-1.5 text-xs"
          value={instruction.road.name ?? ""}
          onChange={(e) => onChange({ road: { ...instruction.road, name: e.target.value } })}
        />
      </div>

      <Input
        placeholder="Destinació"
        list="dl-destinations"
        className="h-9 px-1.5 text-xs"
        value={instruction.destination ?? ""}
        onChange={(e) => onChange({ destination: e.target.value })}
      />

      <Input
        placeholder="Informació / observacions"
        list="dl-information"
        className="h-9 px-1.5 text-xs"
        value={instruction.information ?? ""}
        onChange={(e) => onChange({ information: e.target.value })}
      />

      <RowActions
        locked={instruction.lockedKm}
        onToggleLock={() => onChange({ lockedKm: !instruction.lockedKm })}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onInsertBefore={onInsertBefore}
        onInsertAfter={onInsertAfter}
      />
    </div>
  );
}

function RowActions({
  locked,
  onToggleLock,
  onDuplicate,
  onDelete,
  onInsertBefore,
  onInsertAfter,
}: {
  locked: boolean;
  onToggleLock: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInsertBefore: () => void;
  onInsertAfter: () => void;
}) {
  return (
    <div className="flex items-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
      <details className="relative">
        <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
          <span className="text-lg leading-none">⋮</span>
        </summary>
        <div className="absolute right-0 top-8 z-20 w-44 rounded-md border border-slate-200 bg-white p-1 text-xs shadow-lg">
          <RowMenuButton
            icon={locked ? Unlock : Lock}
            label={locked ? "Desfixa km" : "Fixa quilometratge"}
            onClick={onToggleLock}
          />
          <RowMenuButton icon={Plus} label="Insereix abans" onClick={onInsertBefore} />
          <RowMenuButton icon={Plus} label="Insereix després" onClick={onInsertAfter} />
          <RowMenuButton icon={Copy} label="Duplica (Ctrl+D)" onClick={onDuplicate} />
          <RowMenuButton icon={Trash2} label="Elimina (Ctrl+⌫)" onClick={onDelete} danger />
        </div>
      </details>
    </div>
  );
}

function RowMenuButton({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-50",
        danger ? "text-red-600" : "text-slate-700",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
