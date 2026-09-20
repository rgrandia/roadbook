"use client";

import { Flag, ListChecks, MousePointerClick, Signpost } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { NewRoadbookDialog } from "./new-roadbook-dialog";

const STEPS = [
  { icon: Flag, title: "Nom", description: "Posa nom al ral·li." },
  { icon: Signpost, title: "Etapes", description: "Tria quantes etapes vols començar." },
  { icon: ListChecks, title: "Primer sector", description: "Es crea automàticament, llest per editar." },
  { icon: MousePointerClick, title: "Instruccions", description: "Selecciona, escriu, Tab, Enter i repeteix." },
];

export function Onboarding() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-10 py-20 text-center">
      <div className="flex flex-col items-center gap-5">
        <AppLogo size={56} />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Crea el teu primer roadbook</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Rally Roadbook et permet preparar el recorregut d&apos;un ral·li en minuts: etapes, sectors, instruccions
            amb icones i quilometratge que es calcula sol.
          </p>
        </div>
      </div>
      <ol className="grid w-full grid-cols-2 gap-3 text-left sm:grid-cols-4">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <step.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-red-500">Pas {i + 1}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{step.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <NewRoadbookDialog />
    </div>
  );
}
