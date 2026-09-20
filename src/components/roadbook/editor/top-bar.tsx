"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Menu, Redo2, Settings, Undo2 } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useRoadbookStore } from "@/store/roadbook-store";
import { useUndoRedo } from "@/store/use-undo-redo";
import { SaveStatus } from "./save-status";

const darkGhost = "text-slate-300 hover:bg-white/10 hover:text-white disabled:text-slate-600";

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
    <header className="z-10 flex h-14 shrink-0 items-center gap-2 border-b border-slate-800/60 bg-slate-900/95 px-3 shadow-sm backdrop-blur-md">
      <Button variant="ghost" size="icon" className={cn("md:hidden", darkGhost)} onClick={onToggleSidebar} aria-label="Estructura">
        <Menu className="h-4 w-4" />
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon" className={darkGhost}>
            <Link href="/" aria-label="Tornar al tauler">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Tauler de projectes</TooltipContent>
      </Tooltip>

      <AppLogo size={28} />

      {editing ? (
        <Input
          autoFocus
          value={draft}
          className="h-8 w-64 border-slate-700 bg-slate-800 text-sm font-medium text-white placeholder:text-slate-500"
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
          className="max-w-64 truncate rounded px-1.5 py-1 text-sm font-semibold text-white hover:bg-white/10"
        >
          {roadbook.name}
        </button>
      )}

      <SaveStatus />

      <div className="ml-auto flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={darkGhost} onClick={undo} disabled={!canUndo} aria-label="Desfer">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Desfer (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={darkGhost} onClick={redo} disabled={!canRedo} aria-label="Refer">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refer (Ctrl+Maj+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={darkGhost} onClick={onOpenSettings} aria-label="Configuració">
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Configuració del document</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
