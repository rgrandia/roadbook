"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronRight, Copy, GripVertical, Plus, Route, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKm } from "@/lib/roadbook/calc";
import { sectorTotalDistance } from "@/lib/roadbook/calc";
import { useRoadbookStore } from "@/store/roadbook-store";
import { cn } from "@/lib/utils";

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const roadbook = useRoadbookStore((s) => s.roadbook)!;
  const selectedSectorId = useRoadbookStore((s) => s.selectedSectorId);
  const select = useRoadbookStore((s) => s.select);
  const addStage = useRoadbookStore((s) => s.addStage);
  const renameStage = useRoadbookStore((s) => s.renameStage);
  const deleteStage = useRoadbookStore((s) => s.deleteStage);
  const reorderStages = useRoadbookStore((s) => s.reorderStages);
  const addSector = useRoadbookStore((s) => s.addSector);
  const duplicateSector = useRoadbookStore((s) => s.duplicateSector);
  const deleteSector = useRoadbookStore((s) => s.deleteSector);
  const reorderSectors = useRoadbookStore((s) => s.reorderSectors);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function toggleCollapsed(stageId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  }

  function handleStageDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = roadbook.stages.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, String(active.id));
    reorderStages(reordered);
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Tanca l'estructura"
          onClick={onClose}
          className="fixed inset-x-0 bottom-0 top-14 z-30 bg-slate-950/30 md:hidden"
        />
      )}
      <aside
        className={cn(
          "z-40 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white transition-transform",
          "fixed bottom-0 left-0 top-14 md:static md:top-auto md:translate-x-0",
          "md:overflow-hidden md:rounded-2xl md:border md:border-slate-200/80 md:shadow-sm",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Estructura</p>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              addStage();
              onClose();
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Etapa
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStageDragEnd}>
            <SortableContext items={roadbook.stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2.5">
                {roadbook.stages.map((stage) => (
                  <StageItem
                    key={stage.id}
                    stage={stage}
                    isCollapsed={collapsed.has(stage.id)}
                    onToggleCollapsed={() => toggleCollapsed(stage.id)}
                    selectedSectorId={selectedSectorId}
                    onRename={(name) => renameStage(stage.id, name)}
                    onDelete={() => {
                      if (roadbook.stages.length <= 1) return;
                      if (window.confirm(`Eliminar l'etapa "${stage.name}" i tots els seus sectors?`)) {
                        deleteStage(stage.id);
                      }
                    }}
                    onAddSector={() => addSector(stage.id)}
                    onSelectSector={(sectorId) => {
                      select(stage.id, sectorId);
                      onClose();
                    }}
                    onDuplicateSector={(sectorId) => duplicateSector(stage.id, sectorId)}
                    onDeleteSector={(sectorId, name) => {
                      if (window.confirm(`Eliminar el sector "${name}"?`)) {
                        deleteSector(stage.id, sectorId);
                      }
                    }}
                    onReorderSectors={(ids) => reorderSectors(stage.id, ids)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {roadbook.stages.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-slate-400">Encara no hi ha cap etapa.</p>
          )}
        </div>
      </aside>
    </>
  );
}

interface StageItemProps {
  stage: import("@/lib/roadbook/types").Stage;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  selectedSectorId: string | null;
  onRename: (name: string) => void;
  onDelete: () => void;
  onAddSector: () => void;
  onSelectSector: (sectorId: string) => void;
  onDuplicateSector: (sectorId: string) => void;
  onDeleteSector: (sectorId: string, name: string) => void;
  onReorderSectors: (ids: string[]) => void;
}

function StageItem({
  stage,
  isCollapsed,
  onToggleCollapsed,
  selectedSectorId,
  onRename,
  onDelete,
  onAddSector,
  onSelectSector,
  onDuplicateSector,
  onDeleteSector,
  onReorderSectors,
}: StageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(stage.name);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleSectorDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = stage.sectors.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, String(active.id));
    onReorderSectors(reordered);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow",
        isDragging && "opacity-60 shadow-md",
      )}
    >
      <div className="flex items-center gap-1 border-b border-slate-100 bg-slate-50/80 px-1.5 py-1.5">
        <button
          type="button"
          className="cursor-grab touch-none text-slate-300 hover:text-slate-500"
          {...attributes}
          {...listeners}
          aria-label="Arrossega l'etapa"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggleCollapsed} className="text-slate-400 hover:text-slate-600">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {editing ? (
          <Input
            autoFocus
            value={draft}
            className="h-7 text-sm"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              if (draft.trim()) onRename(draft.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setDraft(stage.name);
                setEditing(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 truncate text-left text-sm font-semibold text-slate-800"
          >
            {stage.name}
          </button>
        )}
        <Button size="iconSm" variant="ghost" onClick={onAddSector} aria-label="Afegeix sector">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button size="iconSm" variant="ghost" onClick={onDelete} aria-label="Elimina etapa">
          <Trash2 className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </div>
      {!isCollapsed && (
        <div className="flex flex-col gap-1 p-1.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectorDragEnd}>
            <SortableContext items={stage.sectors.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {stage.sectors.map((sector) => (
                <SectorItem
                  key={sector.id}
                  sector={sector}
                  selected={sector.id === selectedSectorId}
                  onSelect={() => onSelectSector(sector.id)}
                  onDuplicate={() => onDuplicateSector(sector.id)}
                  onDelete={() => onDeleteSector(sector.id, sector.name)}
                />
              ))}
            </SortableContext>
          </DndContext>
          {stage.sectors.length === 0 && (
            <button
              type="button"
              onClick={onAddSector}
              className="rounded-lg border border-dashed border-slate-200 py-2 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
            >
              + Afegir sector
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SectorItem({
  sector,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  sector: import("@/lib/roadbook/types").Sector;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sector.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-1 border-l-2 py-1 pl-1.5 pr-1 text-sm transition-colors",
        selected
          ? "border-l-red-600 bg-red-50 text-red-700"
          : "border-l-transparent text-slate-600 hover:border-l-slate-200 hover:bg-slate-50",
        isDragging && "opacity-60",
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-slate-300 hover:text-slate-500"
        {...attributes}
        {...listeners}
        aria-label="Arrossega el sector"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-1.5 truncate text-left">
        <Route className={cn("h-3.5 w-3.5 shrink-0", selected ? "text-red-600" : "text-slate-400")} />
        <span className={cn("truncate", selected && "font-medium")}>
          {sector.number}. {sector.name}
        </span>
        <span className={cn("ml-auto shrink-0 text-[11px]", selected ? "text-red-400" : "text-slate-400")}>
          {formatKm(sectorTotalDistance(sector))} km
        </span>
      </button>
      <Button
        size="iconSm"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100"
        onClick={onDuplicate}
        aria-label="Duplica sector"
      >
        <Copy className="h-3 w-3" />
      </Button>
      <Button
        size="iconSm"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100"
        onClick={onDelete}
        aria-label="Elimina sector"
      >
        <Trash2 className="h-3 w-3 text-slate-400" />
      </Button>
    </div>
  );
}
