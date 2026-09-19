"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { saveRoadbook } from "@/lib/db";
import { useRoadbookStore } from "./roadbook-store";
import { useUndoRedo } from "./use-undo-redo";

/** App-wide shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+S. */
export function useGlobalShortcuts() {
  const { undo, redo } = useUndoRedo();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (key === "z") {
        e.preventDefault();
        undo();
      } else if (key === "s") {
        e.preventDefault();
        const roadbook = useRoadbookStore.getState().roadbook;
        if (!roadbook) return;
        useRoadbookStore.getState().setSaveStatus("saving");
        saveRoadbook(roadbook).then(() => {
          useRoadbookStore.getState().setSaveStatus("saved", new Date().toISOString());
          toast.success("Roadbook guardat.");
        });
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
}
