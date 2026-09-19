import { nanoid } from "nanoid";
import { DEFAULT_SETTINGS, type Instruction, type Roadbook, type Sector, type Stage } from "./types";

export function createId(): string {
  return nanoid(10);
}

export function createInstruction(partial: Partial<Instruction> = {}): Instruction {
  return {
    id: createId(),
    order: 1,
    distance: 0,
    totalKm: 0,
    partialKm: 0,
    lockedKm: false,
    direction: "straight",
    category: "normal",
    danger: false,
    road: {},
    roadType: "none",
    ...partial,
  };
}

export function createSector(partial: Partial<Sector> = {}, number = 1): Sector {
  return {
    id: createId(),
    order: 1,
    number,
    name: `Sector ${number}`,
    sectorType: "special",
    startKm: 0,
    instructions: [],
    ...partial,
  };
}

export function createStage(partial: Partial<Stage> = {}, order = 1): Stage {
  return {
    id: createId(),
    order,
    name: `Etapa ${order}`,
    sectors: [],
    ...partial,
  };
}

export function createRoadbook(name: string): Roadbook {
  const now = new Date().toISOString();
  return {
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_SETTINGS },
    stages: [],
  };
}

/** Builds a ready-to-edit roadbook with N stages, each pre-seeded with a first sector. */
export function createStarterRoadbook(name: string, stageCount = 1): Roadbook {
  const roadbook = createRoadbook(name);
  let sectorNumber = 1;
  roadbook.stages = Array.from({ length: Math.max(1, stageCount) }, (_, i) => {
    const stage = createStage({}, i + 1);
    stage.sectors = [createSector({}, sectorNumber)];
    sectorNumber += 1;
    return stage;
  });
  return roadbook;
}
