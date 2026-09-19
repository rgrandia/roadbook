"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { EditorShell } from "@/components/roadbook/editor/editor-shell";
import { loadRoadbookById } from "@/lib/db";
import { useRoadbookStore } from "@/store/roadbook-store";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Keying on id makes the loader below remount (and reset its state) for
  // every new roadbook instead of needing to manually reset state on change.
  return <EditorPageLoader key={id} id={id} />;
}

function EditorPageLoader({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");
  const roadbook = useRoadbookStore((s) => s.roadbook);
  const loadRoadbook = useRoadbookStore((s) => s.loadRoadbook);
  const clearRoadbook = useRoadbookStore((s) => s.clearRoadbook);

  useEffect(() => {
    let cancelled = false;
    clearRoadbook();
    useRoadbookStore.temporal.getState().clear();

    loadRoadbookById(id).then((found) => {
      if (cancelled) return;
      if (!found) {
        setStatus("not-found");
        return;
      }
      loadRoadbook(found);
      useRoadbookStore.temporal.getState().clear();
      setStatus("ready");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (status === "not-found") {
      toast.error("No s'ha trobat aquest roadbook.");
      router.replace("/");
    }
  }, [status, router]);

  if (status !== "ready" || !roadbook) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return <EditorShell />;
}
