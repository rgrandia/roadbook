"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getDb, deleteCustomIcon, saveCustomIcon } from "@/lib/db";
import { createId } from "@/lib/roadbook/factory";
import { buildCustomGlyph } from "@/lib/roadbook/direction-icons";
import type { CustomDirectionIcon } from "@/lib/roadbook/types";
import { cn } from "@/lib/utils";
import { DirectionIcon } from "./direction-icon";

const ANGLE_PRESETS = [-180, -120, -90, -60, -30, 0, 30, 60, 90, 120, 180];

function clampAngle(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(-180, Math.min(180, Math.round(n)));
}

function blankForm() {
  return { editingId: null as string | null, name: "", takenAngle: 0, otherAngles: [] as number[], roundabout: false };
}

/**
 * Personal library of user-designed direction icons, built with the same
 * parametric turn/junction/roundabout model as the built-in ~45 pictograms
 * (see buildCustomGlyph), so anything created here stays visually
 * consistent with the rest of the roadbook. Saved to a browser-wide Dexie
 * table (src/lib/db.ts): local to this device, shared across every
 * roadbook, same as the built-in set.
 */
export function IconDesignerDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful save, with the saved icon - lets a caller (e.g. the direction picker) auto-select it. */
  onSaved?: (icon: CustomDirectionIcon) => void;
}) {
  const icons = useLiveQuery(() => getDb().customIcons.orderBy("createdAt").toArray(), []);
  const [form, setForm] = useState(blankForm());

  const previewGlyph = buildCustomGlyph({
    takenAngle: form.takenAngle,
    otherAngles: form.roundabout ? [] : form.otherAngles,
    roundabout: form.roundabout,
  });

  function pickAngleFromClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const angle = clampAngle((Math.atan2(dx, -dy) * 180) / Math.PI);
    setForm((f) => ({ ...f, takenAngle: angle }));
  }

  function nudgeAngle(e: React.KeyboardEvent<SVGSVGElement>) {
    const step = e.shiftKey ? 1 : 5;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      setForm((f) => ({ ...f, takenAngle: clampAngle(f.takenAngle + step) }));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setForm((f) => ({ ...f, takenAngle: clampAngle(f.takenAngle - step) }));
    } else if (e.key === "Home") {
      e.preventDefault();
      setForm((f) => ({ ...f, takenAngle: -180 }));
    } else if (e.key === "End") {
      e.preventDefault();
      setForm((f) => ({ ...f, takenAngle: 180 }));
    }
  }

  function addOtherAngle() {
    setForm((f) => (f.otherAngles.length >= 3 ? f : { ...f, otherAngles: [...f.otherAngles, 90] }));
  }

  function updateOtherAngle(index: number, value: number) {
    setForm((f) => ({ ...f, otherAngles: f.otherAngles.map((a, i) => (i === index ? clampAngle(value) : a)) }));
  }

  function removeOtherAngle(index: number) {
    setForm((f) => ({ ...f, otherAngles: f.otherAngles.filter((_, i) => i !== index) }));
  }

  function startEdit(icon: CustomDirectionIcon) {
    setForm({
      editingId: icon.id,
      name: icon.name,
      takenAngle: icon.takenAngle,
      otherAngles: icon.otherAngles,
      roundabout: icon.roundabout,
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Eliminar aquesta icona? Les instruccions que la facin servir quedaran sense icona.")) return;
    await deleteCustomIcon(id);
    if (form.editingId === id) setForm(blankForm());
    toast.success("Icona eliminada.");
  }

  async function handleSave() {
    const name = form.name.trim();
    if (!name) {
      toast.error("Posa un nom a la icona.");
      return;
    }
    const icon: CustomDirectionIcon = {
      id: form.editingId ?? createId(),
      name,
      takenAngle: form.takenAngle,
      otherAngles: form.roundabout ? [] : form.otherAngles,
      roundabout: form.roundabout,
      createdAt: new Date().toISOString(),
    };
    await saveCustomIcon(icon);
    toast.success(form.editingId ? "Icona actualitzada." : "Icona creada.");
    setForm(blankForm());
    onSaved?.(icon);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Icones personalitzades</DialogTitle>
          <DialogDescription>
            Dissenya nous pictogrames de direcció amb el mateix estil que la resta del roadbook. Es guarden en aquest
            navegador i estan disponibles a tots els teus roadbooks.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-1 gap-5 overflow-y-auto pr-1 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <svg
              viewBox="0 0 200 200"
              width={160}
              height={160}
              role="slider"
              tabIndex={0}
              aria-label="Angle del camí pres"
              aria-valuemin={-180}
              aria-valuemax={180}
              aria-valuenow={form.takenAngle}
              aria-valuetext={`${form.takenAngle} graus`}
              className="cursor-crosshair rounded-full border border-slate-200 bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
              onClick={pickAngleFromClick}
              onKeyDown={nudgeAngle}
            >
              <circle cx={100} cy={100} r={92} fill="none" stroke="#e2e8f0" strokeWidth={1} />
              <circle cx={100} cy={100} r={2} fill="#94a3b8" />
              <line
                x1={100}
                y1={100}
                x2={100 + 88 * Math.sin((form.takenAngle * Math.PI) / 180)}
                y2={100 - 88 * Math.cos((form.takenAngle * Math.PI) / 180)}
                stroke="#dc2626"
                strokeWidth={2}
              />
            </svg>
            <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <DirectionIcon direction="custom" glyph={previewGlyph} label={form.name || "Previsualització"} size={54} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <Label>Nom de la icona</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="p. ex. Gir tancat a 100°"
              />
            </div>

            <div>
              <Label>Angle del camí pres ({form.takenAngle}°)</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {ANGLE_PRESETS.map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, takenAngle: angle }))}
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-xs",
                      form.takenAngle === angle
                        ? "border-red-500 bg-red-50 text-red-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {angle}°
                  </button>
                ))}
                <Input
                  type="number"
                  className="h-6 w-20 px-1.5 text-xs"
                  value={form.takenAngle}
                  onChange={(e) => setForm((f) => ({ ...f, takenAngle: clampAngle(Number(e.target.value)) }))}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.roundabout}
                onChange={(e) => setForm((f) => ({ ...f, roundabout: e.target.checked }))}
              />
              És una rotonda (dibuixa el cercle)
            </label>

            {!form.roundabout && (
              <div>
                <div className="flex items-center justify-between">
                  <Label>Altres sortides no preses ({form.otherAngles.length}/3)</Label>
                  {form.otherAngles.length < 3 && (
                    <Button size="sm" variant="ghost" onClick={addOtherAngle}>
                      <Plus className="h-3.5 w-3.5" /> Afegeix
                    </Button>
                  )}
                </div>
                <div className="mt-1 flex flex-col gap-1.5">
                  {form.otherAngles.map((angle, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        className="h-8 w-24"
                        value={angle}
                        onChange={(e) => updateOtherAngle(i, Number(e.target.value))}
                      />
                      <span className="text-xs text-slate-400">graus</span>
                      <Button size="iconSm" variant="ghost" onClick={() => removeOtherAngle(i)} aria-label="Elimina sortida">
                        <X className="h-3.5 w-3.5 text-slate-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-1 flex items-center gap-2">
              <Button variant="primary" onClick={handleSave}>
                {form.editingId ? "Desa els canvis" : "Crea la icona"}
              </Button>
              {form.editingId && (
                <Button variant="ghost" onClick={() => setForm(blankForm())}>
                  Cancel·la
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Les meves icones ({icons?.length ?? 0})
        </p>
        <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
          {icons?.length === 0 && <p className="text-xs text-slate-400">Encara no has creat cap icona.</p>}
          {icons?.map((icon) => (
            <div key={icon.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5">
              <DirectionIcon direction="custom" glyph={buildCustomGlyph(icon)} label={icon.name} size={20} />
              <span className="flex-1 truncate text-sm text-slate-700">{icon.name}</span>
              <button type="button" onClick={() => startEdit(icon)} className="text-xs text-slate-500 hover:text-slate-800">
                Edita
              </button>
              <Button size="iconSm" variant="ghost" onClick={() => handleDelete(icon.id)} aria-label="Elimina icona">
                <Trash2 className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
