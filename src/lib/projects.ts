import { deleteRoadbookById, getDb, listRoadbooks, saveRoadbook } from "./db";
import { recalcRoadbook, roadbookSectorCount, roadbookTotalDistance } from "./roadbook/calc";
import { createId, createStarterRoadbook } from "./roadbook/factory";
import type { CustomDirectionIcon, Roadbook, RoadbookSummary } from "./roadbook/types";

export function toSummary(roadbook: Roadbook): RoadbookSummary {
  return {
    id: roadbook.id,
    name: roadbook.name,
    updatedAt: roadbook.updatedAt,
    createdAt: roadbook.createdAt,
    stageCount: roadbook.stages.length,
    sectorCount: roadbookSectorCount(roadbook),
    totalDistanceKm: roadbookTotalDistance(roadbook),
  };
}

export async function listProjectSummaries(): Promise<RoadbookSummary[]> {
  const roadbooks = await listRoadbooks();
  return roadbooks.map(toSummary);
}

export async function createProject(name: string, stageCount = 1): Promise<Roadbook> {
  const roadbook = createStarterRoadbook(name, stageCount);
  await saveRoadbook(roadbook);
  return roadbook;
}

export async function duplicateProject(source: Roadbook): Promise<Roadbook> {
  const now = new Date().toISOString();
  const clone: Roadbook = {
    ...source,
    id: createId(),
    name: `${source.name} (còpia)`,
    createdAt: now,
    updatedAt: now,
    stages: source.stages.map((stage) => ({
      ...stage,
      id: createId(),
      sectors: stage.sectors.map((sector) => ({
        ...sector,
        id: createId(),
        instructions: sector.instructions.map((instruction) => ({
          ...instruction,
          id: createId(),
        })),
      })),
    })),
  };
  await saveRoadbook(clone);
  return clone;
}

export async function deleteProject(id: string): Promise<void> {
  await deleteRoadbookById(id);
}

/** Shape written by exportProjectToJson - a roadbook plus the custom icons it actually uses, so sharing the file shares the icons too. */
export interface RoadbookExportFile {
  roadbook: Roadbook;
  customIcons: CustomDirectionIcon[];
}

function collectUsedCustomIconIds(roadbook: Roadbook): string[] {
  const ids = new Set<string>();
  for (const stage of roadbook.stages) {
    for (const sector of stage.sectors) {
      for (const instruction of sector.instructions) {
        if (instruction.direction === "custom" && instruction.customIconId) {
          ids.add(instruction.customIconId);
        }
      }
    }
  }
  return [...ids];
}

/** Builds the export payload for a roadbook: itself plus whichever custom icons it actually uses. Pure data - no DOM/download side effects, so it's easy to unit test. */
export async function buildRoadbookExportFile(roadbook: Roadbook): Promise<RoadbookExportFile> {
  const usedIds = collectUsedCustomIconIds(roadbook);
  const found = usedIds.length ? await getDb().customIcons.bulkGet(usedIds) : [];
  return {
    roadbook,
    customIcons: found.filter((icon): icon is CustomDirectionIcon => icon !== undefined),
  };
}

/** Exports a roadbook as JSON, bundling any custom direction icons it uses so the file is self-contained on another device. */
export async function exportProjectToJson(roadbook: Roadbook): Promise<void> {
  const file = await buildRoadbookExportFile(roadbook);
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugify(roadbook.name)}.roadbook.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export class InvalidRoadbookFileError extends Error {}

/**
 * Parses + minimally validates a roadbook JSON file, assigning a fresh id.
 * Accepts both the current `{ roadbook, customIcons }` export shape and a
 * plain roadbook object (files exported before custom icons existed, or by
 * older code), merging any bundled custom icons into the local library
 * (skipping ones that already exist here, so re-importing is idempotent).
 */
export async function importProjectFromJson(file: File): Promise<Roadbook> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidRoadbookFileError("El fitxer no és un JSON vàlid.");
  }

  let roadbookLike: unknown = parsed;
  let bundledIcons: CustomDirectionIcon[] = [];
  if (parsed && typeof parsed === "object" && "roadbook" in (parsed as Record<string, unknown>)) {
    const wrapper = parsed as { roadbook: unknown; customIcons?: unknown };
    roadbookLike = wrapper.roadbook;
    if (Array.isArray(wrapper.customIcons)) bundledIcons = wrapper.customIcons as CustomDirectionIcon[];
  }

  if (!isRoadbookLike(roadbookLike)) {
    throw new InvalidRoadbookFileError("El fitxer no té l'estructura d'un roadbook.");
  }

  if (bundledIcons.length > 0) {
    const db = getDb();
    const existingIds = new Set((await db.customIcons.toCollection().primaryKeys()) as string[]);
    const toAdd = bundledIcons.filter((icon) => icon && typeof icon.id === "string" && !existingIds.has(icon.id));
    if (toAdd.length > 0) await db.customIcons.bulkPut(toAdd);
  }

  const now = new Date().toISOString();
  const roadbook: Roadbook = recalcRoadbook({
    ...roadbookLike,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  });
  await saveRoadbook(roadbook);
  return roadbook;
}

function isRoadbookLike(value: unknown): value is Roadbook {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.name === "string" && Array.isArray(v.stages) && typeof v.settings === "object";
}

function slugify(value: string): string {
  return (
    value
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "roadbook"
  );
}
