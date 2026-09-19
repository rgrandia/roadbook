"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, Redo2, Settings, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRoadbookStore } from "@/store/roadbook-store";
import { useUndoRedo } from "@/store/use-undo-redo";
import { SaveStatus } from "./save-status";

export function TopBar({
  onOpenSettings,
  onToggleSidebar,
}: {
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
}) {
  const roadbook = useRoadbookStore((s) => s.roadbook)!;
  const renameRoadbook = useRoadbookStore((s) => s.renameRoadbook);
  const { canUndo, canRedo, undo, redo } = useUndoRedo();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(roadbook.name);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleSidebar} aria-label="Estructura">
        <Menu className="h-4 w-4" />
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon">
            <Link href="/" aria-label="Tornar al tauler">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Tauler de projectes</TooltipContent>
      </Tooltip>

      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600 text-[11px] font-bold text-white">
        RB
      </div>

      {editing ? (
        <Input
          autoFocus
          value={draft}
          className="h-8 w-64 text-sm font-medium"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft.trim()) renameRoadbook(draft.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(roadbook.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(roadbook.name);
            setEditing(true);
          }}
          className="max-w-64 truncate rounded px-1.5 py-1 text-sm font-semibold text-slate-900 hover:bg-slate-100"
        >
          {roadbook.name}
        </button>
      )}

      <SaveStatus />

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Desfer">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Desfer (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Refer">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refer (Ctrl+Maj+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onOpenSettings} aria-label="Configuració">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Configuració del document</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
