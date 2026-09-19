import type { Instruction, InstructionCategory, Roadbook, Sector, Stage } from "./types";

/**
 * Categories that reset the "km parcial" counter back to zero, mirroring the
 * convention used in printed rally roadbooks where the partial distance
 * counts from the last control point rather than from the sector start.
 */
const RESET_CATEGORIES: ReadonlySet<InstructionCategory> = new Set(["start", "stop", "regroup", "control"]);

/**
 * Recomputes totalKm and partialKm for every instruction in a sector, in
 * order. This is THE central function of the app: everything that edits,
 * inserts, deletes, reorders or duplicates an instruction must end by
 * calling this so the displayed km values stay consistent.
 *
 * Rules:
 * - totalKm(i) = totalKm(i-1) + distance(i), unless lockedKm(i) is true, in
 *   which case totalKm(i) is kept as-is (the entered value wins) and the
 *   chain continues from that fixed value for row i+1.
 * - distance is never negative; callers should clamp/validate on input, but
 *   this function does not silently "fix" a negative distance since that is
 *   a value the user explicitly typed.
 * - partialKm resets to distance(i) alone right after a reset-category row
 *   (start/stop/regroup/control), otherwise it accumulates like totalKm.
 */
export function recalcSector(sector: Sector): Sector {
  let runningTotal = sector.startKm;
  let runningPartial = 0;
  let justReset = true; // the sector start itself is a reset point

  const instructions = sector.instructions.map((instruction, index) => {
    const order = index + 1;
    const totalKm = instruction.lockedKm ? instruction.totalKm : round2(runningTotal + instruction.distance);

    const partialKm = justReset ? round2(instruction.distance) : round2(runningPartial + instruction.distance);

    runningTotal = totalKm;
    runningPartial = partialKm;
    justReset = RESET_CATEGORIES.has(instruction.category);

    if (instruction.order === order && instruction.totalKm === totalKm && instruction.partialKm === partialKm) {
      return instruction;
    }
    return { ...instruction, order, totalKm, partialKm };
  });

  return { ...sector, instructions };
}

/** Recomputes every sector of a stage. */
export function recalcStage(stage: Stage): Stage {
  return { ...stage, sectors: stage.sectors.map(recalcSector) };
}

/** Recomputes every stage of a roadbook. */
export function recalcRoadbook(roadbook: Roadbook): Roadbook {
  return { ...roadbook, stages: roadbook.stages.map(recalcStage) };
}

export function sectorTotalDistance(sector: Sector): number {
  return round2(sector.instructions.reduce((sum, i) => sum + i.distance, 0));
}

export function stageTotalDistance(stage: Stage): number {
  return round2(stage.sectors.reduce((sum, s) => sum + sectorTotalDistance(s), 0));
}

export function roadbookTotalDistance(roadbook: Roadbook): number {
  return round2(roadbook.stages.reduce((sum, s) => sum + stageTotalDistance(s), 0));
}

export function roadbookSectorCount(roadbook: Roadbook): number {
  return roadbook.stages.reduce((sum, s) => sum + s.sectors.length, 0);
}

/**
 * Derives the estimated time (minutes) for a sector: the manual override
 * wins when set, otherwise it's derived from distance / average speed.
 * Kept separate from recalcSector so it can be called cheaply for display
 * without touching the instruction array.
 */
export function sectorEstimatedTimeMinutes(sector: Sector): number | undefined {
  if (sector.estimatedTimeMinutes != null) return sector.estimatedTimeMinutes;
  if (sector.averageSpeedKmh && sector.averageSpeedKmh > 0) {
    const distance = sectorTotalDistance(sector);
    return round2((distance / sector.averageSpeedKmh) * 60);
  }
  return undefined;
}

export function formatMinutes(minutes: number | undefined): string {
  if (minutes == null || Number.isNaN(minutes)) return "--";
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}min` : `${m} min`;
}

export function formatKm(value: number, decimals = 2): string {
  if (Number.isNaN(value)) return "--";
  return value.toFixed(decimals).replace(".", ",");
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Renumbers instruction "order" fields after a structural change (insert,
 * delete, reorder, duplicate) and recalculates km. Callers should always
 * pass through this rather than mutating instructions/order by hand.
 */
export function withRecalculatedInstructions(sector: Sector, instructions: Instruction[]): Sector {
  return recalcSector({ ...sector, instructions });
}
