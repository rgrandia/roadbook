/**
 * Core data model for a Rally Roadbook document.
 *
 * Hierarchy: Roadbook -> Stage (etapa) -> Sector (tram) -> Instruction (nota).
 *
 * The document is stored as a single denormalized JSON object per roadbook
 * (see src/lib/db.ts). This keeps the local-first IndexedDB layer trivial and
 * maps 1:1 onto a future "roadbooks/{id}" document in a cloud store.
 */

export type Id = string;

export type DistanceUnit = "km" | "mi";
export type Language = "ca" | "es" | "en";
export type PageOrientation = "portrait" | "landscape";

/** Direction glyph shown in the "Direcció" column and in the PDF. */
export type DirectionType =
  | "left"
  | "right"
  | "straight"
  | "hairpin-left"
  | "hairpin-right"
  | "fork-left"
  | "fork-right"
  | "slight-left"
  | "slight-right"
  | "roundabout"
  | "junction"
  | "merge"
  | "exit"
  | "u-turn"
  | "none";

/**
 * What kind of row this is. "normal" is a regular direction instruction;
 * the rest are the special rally elements from spec section 12, each
 * rendered as a visually distinct row in the editor, preview and PDF.
 */
export type InstructionCategory =
  "normal" | "start" | "finish" | "stop" | "regroup" | "control" | "danger" | "population" | "info" | "note";

/** Road environment tag, shown as a small badge. */
export type RoadType = "urban" | "rural" | "highway" | "expressway" | "track" | "none";

export interface RoadInfo {
  /** e.g. "C-15B" */
  number?: string;
  /** e.g. "Carretera de Vilafranca" */
  name?: string;
}

export interface Instruction {
  id: Id;
  /** 1-based position within the sector; kept in sync by the calc engine. */
  order: number;

  /** km travelled since the previous instruction row. User-entered. */
  distance: number;
  /** Cumulative km from the start of the sector. Auto-computed unless lockedKm. */
  totalKm: number;
  /** Cumulative km since the last reset point (start/stop/regroup/control). Auto-computed. */
  partialKm: number;
  /** When true, totalKm is treated as fixed and the calc engine will not overwrite it. */
  lockedKm: boolean;

  direction: DirectionType;
  category: InstructionCategory;

  road: RoadInfo;
  /** Destination town/place shown on the instruction. */
  destination?: string;
  /** Free-form point of reference (e.g. "davant de la gasolinera"). */
  reference?: string;
  roadType: RoadType;

  /** Short free text shown in the "Informació" column. */
  information?: string;
  /** Longer free text, printed smaller / secondary. */
  notes?: string;

  /** Optional per-instruction time (mm:ss), manual for the MVP. */
  time?: string;
}

export type SectorType = "special" | "liaison" | "super-special" | "shakedown" | "neutralized" | "other";

export interface Sector {
  id: Id;
  order: number;
  number: number;
  name: string;

  startLocation?: string;
  endLocation?: string;
  sectorType: SectorType;
  notes?: string;

  /** km at which this sector's instruction table starts (usually 0.00). */
  startKm: number;
  /** Average speed used to derive estimated time when no manual override is set. */
  averageSpeedKmh?: number;
  /** Manual override for the sector's estimated time, in minutes. */
  estimatedTimeMinutes?: number;

  instructions: Instruction[];
}

export interface Stage {
  id: Id;
  order: number;
  name: string;
  sectors: Sector[];
}

export interface RoadbookSettings {
  rallyName?: string;
  organization?: string;
  /** ISO date string (yyyy-mm-dd) */
  date?: string;
  /** data: URL for a logo image, embedded directly so the doc is self-contained. */
  logoDataUrl?: string;
  vehicle?: string;
  team?: string;
  startPageNumber: number;
  distanceUnit: DistanceUnit;
  /** number of decimals shown for km values, e.g. 2 -> "12.30" */
  kmDecimals: number;
  language: Language;
  orientation: PageOrientation;
}

export interface Roadbook {
  id: Id;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: RoadbookSettings;
  stages: Stage[];
}

export const DEFAULT_SETTINGS: RoadbookSettings = {
  startPageNumber: 1,
  distanceUnit: "km",
  kmDecimals: 2,
  language: "ca",
  orientation: "portrait",
};

/** Lightweight summary used by the dashboard, derived from a Roadbook. */
export interface RoadbookSummary {
  id: Id;
  name: string;
  updatedAt: string;
  createdAt: string;
  stageCount: number;
  sectorCount: number;
  totalDistanceKm: number;
}
