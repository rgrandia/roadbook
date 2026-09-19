"use client";

import { Flag, ListChecks, MousePointerClick, Signpost } from "lucide-react";
import { NewRoadbookDialog } from "./new-roadbook-dialog";

const STEPS = [
  { icon: Flag, title: "Nom", description: "Posa nom al ral·li." },
  { icon: Signpost, title: "Etapes", description: "Tria quantes etapes vols començar." },
  { icon: ListChecks, title: "Primer sector", description: "Es crea automàticament, llest per editar." },
  { icon: MousePointerClick, title: "Instruccions", description: "Selecciona, escriu, Tab, Enter i repeteix." },
];

export function Onboarding() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-8 py-20 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Crea el teu primer roadbook</h1>
        <p className="mt-2 text-sm text-slate-500">
          Rally Roadbook et permet preparar el recorregut d&apos;un ral·li en minuts: etapes, sectors, instruccions amb
          icones i quilometratge que es calcula sol.
        </p>
      </div>
      <ol className="grid w-full grid-cols-2 gap-4 text-left sm:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600">
              <step.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Pas {i + 1}</p>
              <p className="text-sm font-medium text-slate-900">{step.title}</p>
              <p className="text-xs text-slate-500">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <NewRoadbookDialog />
    </div>
  );
}
