"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutosave } from "@/store/use-autosave";
import { useGlobalShortcuts } from "@/store/use-global-shortcuts";
import { useRoadbookStore } from "@/store/roadbook-store";
import { NewSectorEmptyState } from "./new-sector-empty-state";
import { SectorPanel } from "./sector-panel";
import { SettingsDialog } from "./settings-dialog";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

const PdfPreview = dynamic(() => import("./pdf-preview").then((m) => m.PdfPreview), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
});

export function EditorShell() {
  useAutosave();
  useGlobalShortcuts();

  const roadbook = useRoadbookStore((s) => s.roadbook)!;
  const selectedStageId = useRoadbookStore((s) => s.selectedStageId);
  const selectedSectorId = useRoadbookStore((s) => s.selectedSectorId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<"editor" | "preview">("editor");
  const [exporting, setExporting] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const stage = roadbook.stages.find((s) => s.id === selectedStageId);
  const sector = stage?.sectors.find((s) => s.id === selectedSectorId);

  async function handleExportPdf() {
    setExporting(true);
    try {
      const { downloadRoadbookPdf } = await import("@/lib/pdf/export");
      await downloadRoadbookPdf(roadbook);
    } catch (error) {
      console.error(error);
      toast.error("No s'ha pogut generar el PDF.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <TopBar onOpenSettings={() => setSettingsOpen(true)} onToggleSidebar={() => setMobileSidebarOpen((v) => !v)} />
      <div className="flex flex-1 overflow-hidden bg-slate-100 md:gap-3 md:p-3">
        <Sidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-hidden bg-white md:rounded-2xl md:border md:border-slate-200/80 md:shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as "editor" | "preview");
                setMobileSidebarOpen(false);
              }}
            >
              <TabsList>
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Previsualització</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="primary" onClick={handleExportPdf} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Exportar PDF
            </Button>
          </div>

          {tab === "editor" ? (
            stage && sector ? (
              <SectorPanel stageId={stage.id} sector={sector} />
            ) : (
              <NewSectorEmptyState stageId={stage?.id} />
            )
          ) : (
            <PdfPreview roadbook={roadbook} />
          )}
        </div>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
