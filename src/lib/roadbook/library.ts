import type { InstructionCategory, Roadbook, RoadType } from "./types";

export interface CategoryDef {
  category: InstructionCategory;
  label: string;
  /** Tailwind classes for the row/badge accent. */
  accent: string;
  /** Whether this category renders as a full-width banner row (STOP, META...). */
  banner: boolean;
  /** Short code printed in the PDF banner. */
  code?: string;
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { category: "normal", label: "Instrucció", accent: "bg-white", banner: false },
  { category: "start", label: "Sortida", accent: "bg-emerald-600", banner: true, code: "SORTIDA" },
  { category: "finish", label: "Meta", accent: "bg-slate-900", banner: true, code: "META" },
  { category: "stop", label: "STOP", accent: "bg-red-600", banner: true, code: "STOP" },
  { category: "regroup", label: "Reagrupament", accent: "bg-amber-500", banner: true, code: "REAGRUPAMENT" },
  { category: "control", label: "Control", accent: "bg-blue-600", banner: true, code: "CONTROL" },
  { category: "danger", label: "Perill", accent: "bg-orange-600", banner: false, code: "PERILL" },
  { category: "population", label: "Pas per població", accent: "bg-indigo-100", banner: false },
  { category: "info", label: "Informació", accent: "bg-sky-100", banner: false },
  { category: "note", label: "Nota", accent: "bg-slate-100", banner: false },
];

export const CATEGORY_MAP: Record<InstructionCategory, CategoryDef> = Object.fromEntries(
  CATEGORY_DEFS.map((c) => [c.category, c]),
) as Record<InstructionCategory, CategoryDef>;

/** Categories that obligatorily need a direction to be considered complete. */
export const DIRECTION_REQUIRED_CATEGORIES = new Set<InstructionCategory>(["normal", "population"]);

export const ROAD_TYPE_LABELS: Record<RoadType, string> = {
  urban: "Urbà",
  rural: "Rural",
  highway: "Autopista",
  expressway: "Autovia",
  track: "Camí",
  none: "—",
};

export const ROAD_TYPE_ORDER: RoadType[] = ["urban", "rural", "expressway", "highway", "track"];

/** Quick "Informació" chips insertable with one click (spec section 7). */
export const INFO_CHIPS = [
  "Població",
  "Carretera",
  "Pont",
  "Rotonda",
  "Cruïlla",
  "Gasolinera",
  "Pàrquing",
  "Perillós",
  "Estret",
  "Sense asfaltar",
] as const;

/**
 * Very small prefix-based suggestion engine (spec section 16: no real AI
 * needed for the MVP). Matches a fixed dictionary of common roadbook terms
 * plus any values already used in the current roadbook (roads/destinations),
 * so suggestions get more relevant the more the user has typed.
 */
export function suggest(query: string, dictionary: string[], limit = 6): string[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [];
  const seen = new Set<string>();
  const results: string[] = [];
  for (const entry of dictionary) {
    const normalized = entry.trim();
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase();
    if (seen.has(key)) continue;
    if (key.startsWith(q)) {
      seen.add(key);
      results.push(normalized);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/** Collects every road/destination/information value already used, for autocomplete. */
export function collectRoadbookDictionary(roadbook: Roadbook | null): {
  roads: string[];
  destinations: string[];
  information: string[];
} {
  const roads = new Set<string>();
  const destinations = new Set<string>();
  const information = new Set<string>(BASE_SUGGESTION_DICTIONARY);

  if (roadbook) {
    for (const stage of roadbook.stages) {
      for (const sector of stage.sectors) {
        for (const instruction of sector.instructions) {
          if (instruction.road.name) roads.add(instruction.road.name);
          if (instruction.road.number) roads.add(instruction.road.number);
          if (instruction.destination) destinations.add(instruction.destination);
          if (instruction.information) information.add(instruction.information);
        }
      }
    }
  }

  return { roads: [...roads], destinations: [...destinations], information: [...information] };
}

export const BASE_SUGGESTION_DICTIONARY = [
  "STOP",
  "SORTIDA",
  "META",
  "REAGRUPAMENT",
  "CONTROL",
  "CONTROL HORARI",
  "PERILL",
  "PAS PER POBLACIÓ",
  "ZONA URBANA",
  "SENSE ASFALTAR",
  "COMPTE AMB ELS VIANANTS",
  "PENDENT PRONUNCIADA",
];
