"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCoordinate, haversineDistanceKm } from "@/lib/roadbook/gps";
import { parseGpxFile, samplePoints, type GpxPoint, type ParsedGpx } from "@/lib/roadbook/gpx";
import { useRoadbookStore } from "@/store/roadbook-store";

export function ImportGpxDialog({
  open,
  onOpenChange,
  stageId,
  sectorId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageId: string;
  sectorId: string;
}) {
  const importInstructions = useRoadbookStore((s) => s.importInstructions);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedGpx | null>(null);
  const [sampleEvery, setSampleEvery] = useState(5);

  const usingWaypoints = (parsed?.waypoints.length ?? 0) > 0;
  const pointsToImport: GpxPoint[] = parsed
    ? usingWaypoints
      ? parsed.waypoints
      : samplePoints(parsed.trackPoints, sampleEvery)
    : [];

  function reset() {
    setFileName("");
    setParsed(null);
    setSampleEvery(5);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const result = parseGpxFile(text);
      if (result.waypoints.length === 0 && result.trackPoints.length === 0) {
        toast.error("No s'ha trobat cap punt al fitxer GPX.");
        return;
      }
      setFileName(file.name);
      setParsed(result);
    } catch (error) {
      console.error(error);
      toast.error("No s'ha pogut llegir el fitxer GPX.");
    }
  }

  function handleImport() {
    if (pointsToImport.length === 0) return;
    let previous: GpxPoint | null = null;
    const partials = pointsToImport.map((point) => {
      const distance = previous ? haversineDistanceKm({ lat: previous.lat, lng: previous.lon }, { lat: point.lat, lng: point.lon }) : 0;
      previous = point;
      return {
        distance: Math.round(distance * 100) / 100,
        gpsLat: formatCoordinate(point.lat),
        gpsLng: formatCoordinate(point.lon),
        information: point.name,
        direction: "straight" as const,
      };
    });
    importInstructions(stageId, sectorId, partials);
    toast.success(`${partials.length} instruccions importades.`);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importa una ruta GPX</DialogTitle>
          <DialogDescription>
            Afegeix instruccions al sector actual a partir dels punts d&apos;un fitxer .gpx. La distància entre
            instruccions es calcula automàticament a partir de les coordenades.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleFile} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> {fileName || "Tria un fitxer .gpx"}
            </Button>
          </div>

          {parsed && (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="text-slate-700">
                {parsed.waypoints.length > 0 && (
                  <>
                    <strong>{parsed.waypoints.length}</strong> waypoints trobats.{" "}
                  </>
                )}
                {parsed.trackPoints.length > 0 && (
                  <>
                    <strong>{parsed.trackPoints.length}</strong> punts de track trobats.
                  </>
                )}
              </p>

              {!usingWaypoints && parsed.trackPoints.length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="shrink-0">Importa 1 de cada</Label>
                  <Input
                    type="number"
                    min={1}
                    className="w-20"
                    value={sampleEvery}
                    onChange={(e) => setSampleEvery(Math.max(1, Number(e.target.value) || 1))}
                  />
                  <span className="text-xs text-slate-500">punts (→ {pointsToImport.length} instruccions)</span>
                </div>
              )}
              {usingWaypoints && <p className="text-xs text-slate-500">S&apos;importaran els {pointsToImport.length} waypoints.</p>}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel·la
          </Button>
          <Button variant="primary" onClick={handleImport} disabled={pointsToImport.length === 0}>
            Importa {pointsToImport.length > 0 ? pointsToImport.length : ""} instruccions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
