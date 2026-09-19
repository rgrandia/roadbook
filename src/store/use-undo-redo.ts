"use client";

import { useSyncExternalStore } from "react";
import { useRoadbookStore } from "./roadbook-store";

/** Exposes zundo's temporal store as plain undo/redo state + actions. */
export function useUndoRedo() {
  const temporal = useRoadbookStore.temporal;

  const pastLength = useSyncExternalStore(
    temporal.subscribe,
    () => temporal.getState().pastStates.length,
    () => 0,
  );
  const futureLength = useSyncExternalStore(
    temporal.subscribe,
    () => temporal.getState().futureStates.length,
    () => 0,
  );

  return {
    canUndo: pastLength > 0,
    canRedo: futureLength > 0,
    undo: () => temporal.getState().undo(),
    redo: () => temporal.getState().redo(),
    clear: () => temporal.getState().clear(),
  };
}
