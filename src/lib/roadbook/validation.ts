import { DIRECTION_REQUIRED_CATEGORIES } from "./library";
import type { Roadbook, Sector, Stage } from "./types";

export type WarningSeverity = "warning" | "error";

export interface RoadbookWarning {
  id: string;
  severity: WarningSeverity;
  stageId: string;
  sectorId?: string;
  instructionId?: string;
  message: string;
}

/**
 * Non-blocking validation pass (spec section 29). Never prevents saving or
 * exporting - just surfaces things the user probably wants to fix.
 */
export function validateRoadbook(roadbook: Roadbook): RoadbookWarning[] {
  const warnings: RoadbookWarning[] = [];

  for (const stage of roadbook.stages) {
    if (stage.sectors.length === 0) {
      warnings.push({
        id: `${stage.id}-empty`,
        severity: "warning",
        stageId: stage.id,
        message: `L'etapa "${stage.name}" no té cap sector.`,
      });
    }
    for (const sector of stage.sectors) {
      warnings.push(...validateSector(stage, sector));
    }
  }

  return warnings;
}

export function validateSector(stage: Stage, sector: Sector): RoadbookWarning[] {
  const warnings: RoadbookWarning[] = [];
  const base = { stageId: stage.id, sectorId: sector.id };

  if (sector.instructions.length === 0) {
    warnings.push({
      id: `${sector.id}-empty`,
      severity: "warning",
      ...base,
      message: `El sector "${sector.name}" no té cap instrucció.`,
    });
    return warnings;
  }

  let previousTotal = sector.startKm;
  sector.instructions.forEach((instruction, index) => {
    const label = `Fila ${index + 1} del sector "${sector.name}"`;

    if (instruction.distance < 0) {
      warnings.push({
        id: `${instruction.id}-negative-distance`,
        severity: "error",
        ...base,
        instructionId: instruction.id,
        message: `${label}: la distància no pot ser negativa.`,
      });
    }

    if (instruction.totalKm < previousTotal) {
      warnings.push({
        id: `${instruction.id}-km-decreasing`,
        severity: "error",
        ...base,
        instructionId: instruction.id,
        message: `${label}: el km total (${instruction.totalKm}) és inferior a l'anterior (${previousTotal}).`,
      });
    }
    previousTotal = instruction.totalKm;

    if (instruction.direction === "none" && DIRECTION_REQUIRED_CATEGORIES.has(instruction.category)) {
      warnings.push({
        id: `${instruction.id}-missing-direction`,
        severity: "warning",
        ...base,
        instructionId: instruction.id,
        message: `${label}: falta indicar la direcció.`,
      });
    }

    if (instruction.order !== index + 1) {
      warnings.push({
        id: `${instruction.id}-order`,
        severity: "warning",
        ...base,
        instructionId: instruction.id,
        message: `${label}: numeració incorrecta.`,
      });
    }
  });

  return warnings;
}
