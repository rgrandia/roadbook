"use client";

import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRoadbookStore } from "@/store/roadbook-store";

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const settings = useRoadbookStore((s) => s.roadbook?.settings);
  const updateSettings = useRoadbookStore((s) => s.updateSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!settings) return null;

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateSettings({ logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configuració del document</DialogTitle>
          <DialogDescription>Aquesta informació apareix a la capçalera del PDF. Res és obligatori.</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          <Field label="Nom del ral·li">
            <Input
              value={settings.rallyName ?? ""}
              onChange={(e) => updateSettings({ rallyName: e.target.value })}
              placeholder="Rally Costa Brava"
            />
          </Field>
          <Field label="Organització">
            <Input
              value={settings.organization ?? ""}
              onChange={(e) => updateSettings({ organization: e.target.value })}
              placeholder="Escuderia..."
            />
          </Field>
          <Field label="Data">
            <Input type="date" value={settings.date ?? ""} onChange={(e) => updateSettings({ date: e.target.value })} />
          </Field>
          <Field label="Vehicle">
            <Input value={settings.vehicle ?? ""} onChange={(e) => updateSettings({ vehicle: e.target.value })} />
          </Field>
          <Field label="Equip / Pilots">
            <Input value={settings.team ?? ""} onChange={(e) => updateSettings({ team: e.target.value })} />
          </Field>
          <Field label="Número de pàgina inicial">
            <Input
              type="number"
              min={1}
              value={settings.startPageNumber}
              onChange={(e) => updateSettings({ startPageNumber: Math.max(1, Number(e.target.value) || 1) })}
            />
          </Field>

          <Field label="Logo">
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              {settings.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.logoDataUrl}
                  alt="Logo"
                  className="h-9 w-9 rounded border border-slate-200 object-contain"
                />
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus className="h-3.5 w-3.5" /> {settings.logoDataUrl ? "Canvia" : "Puja logo"}
              </Button>
              {settings.logoDataUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="iconSm"
                  onClick={() => updateSettings({ logoDataUrl: undefined })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </Field>

          <Field label="Idioma">
            <Select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as typeof settings.language })}
            >
              <option value="ca">Català</option>
              <option value="es">Castellà</option>
              <option value="en">English</option>
            </Select>
          </Field>

          <div className="col-span-2">
            <Separator />
          </div>

          <Field label="Unitat de distància">
            <Select
              value={settings.distanceUnit}
              onChange={(e) => updateSettings({ distanceUnit: e.target.value as typeof settings.distanceUnit })}
            >
              <option value="km">Quilòmetres (km)</option>
              <option value="mi">Milles (mi)</option>
            </Select>
          </Field>
          <Field label="Decimals del quilometratge">
            <Select
              value={String(settings.kmDecimals)}
              onChange={(e) => updateSettings({ kmDecimals: Number(e.target.value) })}
            >
              <option value="1">1 decimal (0,0)</option>
              <option value="2">2 decimals (0,00)</option>
            </Select>
          </Field>
          <Field label="Orientació del full">
            <Select
              value={settings.orientation}
              onChange={(e) => updateSettings({ orientation: e.target.value as typeof settings.orientation })}
            >
              <option value="portrait">A4 vertical</option>
              <option value="landscape">A4 horitzontal</option>
            </Select>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
