"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { useRoadbookStore } from "@/store/roadbook-store";
import { formatRelativeTime } from "@/lib/utils";

export function SaveStatus() {
  const saveStatus = useRoadbookStore((s) => s.saveStatus);
  const lastSavedAt = useRoadbookStore((s) => s.lastSavedAt);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  if (saveStatus === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardant...
      </span>
    );
  }
  if (saveStatus === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-600">
        <AlertTriangle className="h-3.5 w-3.5" /> Error en guardar
      </span>
    );
  }
  if (saveStatus === "saved" && lastSavedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-400">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Guardat {formatRelativeTime(lastSavedAt)}
      </span>
    );
  }
  return null;
}
