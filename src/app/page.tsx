"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { NewRoadbookDialog } from "@/components/roadbook/new-roadbook-dialog";
import { Onboarding } from "@/components/roadbook/onboarding";
import { ProjectCard } from "@/components/roadbook/project-card";
import { getDb } from "@/lib/db";
import {
  InvalidRoadbookFileError,
  deleteProject,
  duplicateProject,
  exportProjectToJson,
  importProjectFromJson,
} from "@/lib/projects";
import { toSummary } from "@/lib/projects";
import type { RoadbookSummary } from "@/lib/roadbook/types";

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const roadbooks = useLiveQuery(async () => {
    const all = await getDb().roadbooks.orderBy("updatedAt").reverse().toArray();
    return all.map(toSummary);
  }, []);

  async function handleDuplicate(summary: RoadbookSummary) {
    const full = await getDb().roadbooks.get(summary.id);
    if (!full) return;
    await duplicateProject(full);
    toast.success(`"${summary.name}" duplicat.`);
  }

  async function handleDelete(summary: RoadbookSummary) {
    if (!window.confirm(`Eliminar "${summary.name}"? Aquesta acció no es pot desfer.`)) return;
    await deleteProject(summary.id);
    toast.success("Roadbook eliminat.");
  }

  async function handleExport(summary: RoadbookSummary) {
    const full = await getDb().roadbooks.get(summary.id);
    if (!full) return;
    exportProjectToJson(full);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const roadbook = await importProjectFromJson(file);
      toast.success(`"${roadbook.name}" importat.`);
      router.push(`/r/${roadbook.id}`);
    } catch (error) {
      if (error instanceof InvalidRoadbookFileError) {
        toast.error(error.message);
      } else {
        console.error(error);
        toast.error("No s'ha pogut importar el fitxer.");
      }
    } finally {
      setImporting(false);
    }
  }

  const loading = roadbooks === undefined;
  const isEmpty = roadbooks?.length === 0;

  return (
    <div className="flex-1">
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <AppLogo size={34} />
            <div>
              <p className="text-sm font-semibold leading-none text-white">Rally Roadbook</p>
              <p className="mt-1 text-xs text-slate-400">Els meus roadbooks</p>
            </div>
          </div>
          {!isEmpty && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Importa JSON
              </Button>
              <NewRoadbookDialog />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-24 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : isEmpty ? (
          <Onboarding />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roadbooks?.map((summary) => (
              <ProjectCard
                key={summary.id}
                summary={summary}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onExport={handleExport}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
