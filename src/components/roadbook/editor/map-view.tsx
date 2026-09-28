"use client";

import { useEffect, useMemo, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { MapPin, MousePointerClick } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DIRECTION_LABELS } from "@/lib/roadbook/direction-icons";
import { formatCoordinate, parseLatLng, type LatLng } from "@/lib/roadbook/gps";
import type { Sector } from "@/lib/roadbook/types";
import { useRoadbookStore } from "@/store/roadbook-store";
import { cn } from "@/lib/utils";

function numberedIcon(order: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${
      active ? "#0f172a" : "#dc2626"
    };color:#fff;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${order}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
}

function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }
    map.fitBounds(
      points.map((p) => [p.lat, p.lng]),
      { padding: [32, 32] },
    );
    // Only re-fit when the point *set* changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

function ClickCapture({ enabled, onPick }: { enabled: boolean; onPick: (point: LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface MarkedInstruction {
  id: string;
  order: number;
  point: LatLng;
  label: string;
}

export function MapView({ stageId, sector }: { stageId: string; sector: Sector }) {
  const updateInstruction = useRoadbookStore((s) => s.updateInstruction);
  const [activeId, setActiveId] = useState<string>(sector.instructions[0]?.id ?? "");
  const [armed, setArmed] = useState(false);

  const marked: MarkedInstruction[] = useMemo(
    () =>
      sector.instructions
        .map((instruction) => {
          const point = parseLatLng(instruction.gpsLat, instruction.gpsLng);
          if (!point) return null;
          return {
            id: instruction.id,
            order: instruction.order,
            point,
            label: instruction.information || DIRECTION_LABELS[instruction.direction],
          };
        })
        .filter((m): m is MarkedInstruction => m !== null),
    [sector.instructions],
  );

  function handlePick(point: LatLng) {
    if (!activeId) return;
    updateInstruction(stageId, sector.id, activeId, {
      gpsLat: formatCoordinate(point.lat),
      gpsLng: formatCoordinate(point.lng),
    });
    const index = sector.instructions.findIndex((i) => i.id === activeId);
    const next = sector.instructions[index + 1];
    if (next) setActiveId(next.id);
  }

  if (sector.instructions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-slate-400">
        <MapPin className="h-8 w-8" />
        <p>Aquest sector encara no té instruccions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <Select className="w-64" value={activeId} onChange={(e) => setActiveId(e.target.value)}>
          {sector.instructions.map((i) => (
            <option key={i.id} value={i.id}>
              Nº {i.order} · {i.information || DIRECTION_LABELS[i.direction]}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          variant={armed ? "primary" : "outline"}
          onClick={() => setArmed((v) => !v)}
          className={cn(armed && "animate-pulse")}
        >
          <MousePointerClick className="h-3.5 w-3.5" />
          {armed ? "Clicant al mapa..." : "Clica al mapa per marcar"}
        </Button>
        <p className="text-xs text-slate-400">
          {marked.length} de {sector.instructions.length} instruccions tenen coordenades
        </p>
      </div>

      <div className="relative flex-1">
        <MapContainer center={[41.5, 2]} zoom={7} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={marked.map((m) => m.point)} />
          <ClickCapture enabled={armed && Boolean(activeId)} onPick={handlePick} />
          {marked.length > 1 && (
            <Polyline positions={marked.map((m) => [m.point.lat, m.point.lng])} pathOptions={{ color: "#dc2626", dashArray: "6 6", weight: 2 }} />
          )}
          {marked.map((m) => (
            <Marker key={m.id} position={[m.point.lat, m.point.lng]} icon={numberedIcon(m.order, m.id === activeId)}>
              <Popup>
                Nº {m.order} · {m.label}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <p className="border-t border-slate-100 bg-white px-4 py-1.5 text-center text-[11px] text-slate-400">
        Vista aproximada en línia recta entre punts marcats — no és una ruta per carretera.
      </p>
    </div>
  );
}
