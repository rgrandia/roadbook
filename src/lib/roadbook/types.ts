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

/**
 * Direction pictogram ("tulip") shown in the "Direcció" column and in the
 * PDF. Each one is a schematic top-down junction diagram in the tradition of
 * printed rally roadbooks: a bold line+arrow for the road taken, thin stubs
 * for the roads not taken, and (where relevant) a give-way triangle or the
 * roundabout circle. See direction-icons.ts for the actual path data.
 */
export type DirectionType =
  | "left"
  | "right"
  | "straight"
  | "slight-left"
  | "slight-right"
  | "hairpin-left"
  | "hairpin-right"
  | "tjunction-left"
  | "tjunction-right"
  | "crossroads-left"
  | "crossroads-right"
  | "crossroads-straight"
  | "roundabout-1"
  | "roundabout-2"
  | "roundabout-3"
  | "roundabout-4"
  | "roundabout-5"
  | "fork-left"
  | "fork-right"
  | "motorway-exit-left"
  | "motorway-exit-right"
  | "motorway-keep-left"
  | "motorway-keep-right"
  | "motorway-merge-left"
  | "motorway-merge-right"
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
  /**
   * Danger/caution marker ("!!" in printed roadbooks), independent of
   * category: a normal turn instruction can carry a danger warning without
   * being a whole separate "danger" row.
   */
  danger: boolean;

  road: RoadInfo;
  /**
   * Destination sign text. May contain multiple lines - each non-empty line
   * is printed as its own destination-sign entry in the PDF info panel,
   * matching the stacked signpost look of real roadbooks.
   */
  destination?: string;
  /** Free-form point of reference (e.g. "davant de la gasolinera"). */
  reference?: string;
  roadType: RoadType;

  /** Short free text shown in the "Informació" column. */
  information?: string;
  /** Translation/second-language variant of `information`, printed in italics below it. */
  informationSecondary?: string;
  /** Longer free text, printed smaller / secondary. */
  notes?: string;

  /** Optional per-instruction time (mm:ss), manual for the MVP. */
  time?: string;

  /** GPS latitude, free text so any notation (DMS, decimal...) can be kept as typed. */
  gpsLat?: string;
  /** GPS longitude, free text. */
  gpsLng?: string;
}

export type SectorType = "special" | "liaison" | "super-special" | "shakedown" | "neutralized" | "other";

export interface Sector {
  id: Id;
  order: number;
  number: number;
  name: string;
  /** Optional "Secció/Section" label shown in the PDF page header table, distinct from the sector name. */
  sectionLabel?: string;

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
  /** When set, instructions with `informationSecondary` print it in italics as a translation. */
  secondaryLanguage?: Language;
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
