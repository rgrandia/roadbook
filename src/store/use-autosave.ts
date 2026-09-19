"use client";

import { useEffect, useRef } from "react";
import { saveRoadbook } from "@/lib/db";
import { useRoadbookStore } from "./roadbook-store";

const AUTOSAVE_DELAY_MS = 800;

/**
 * Debounced autosave: writes the current roadbook to IndexedDB shortly
 * after it stops changing, and reflects progress via saveStatus so the top
 * bar can show "Guardant..." / "Guardat" / "Últim guardat fa Xs".
 */
export function useAutosave() {
  const roadbook = useRoadbookStore((s) => s.roadbook);
  const setSaveStatus = useRoadbookStore((s) => s.setSaveStatus);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialized = useRef<string | null>(null);

  useEffect(() => {
    if (!roadbook) return;
    const serialized = JSON.stringify(roadbook);
    if (serialized === lastSerialized.current) return;

    setSaveStatus("saving");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveRoadbook(roadbook);
        lastSerialized.current = serialized;
        setSaveStatus("saved", new Date().toISOString());
      } catch (error) {
        console.error("Autosave failed", error);
        setSaveStatus("error");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [roadbook, setSaveStatus]);

  // Best-effort immediate flush when the tab is about to close/hide, so an
  // accidental reload never loses more than the last few keystrokes.
  useEffect(() => {
    const flush = () => {
      const current = useRoadbookStore.getState().roadbook;
      if (!current) return;
      const serialized = JSON.stringify(current);
      if (serialized === lastSerialized.current) return;
      void saveRoadbook(current);
      lastSerialized.current = serialized;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
}
