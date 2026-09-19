import { deleteRoadbookById, listRoadbooks, saveRoadbook } from "./db";
import { recalcRoadbook, roadbookSectorCount, roadbookTotalDistance } from "./roadbook/calc";
import { createId, createStarterRoadbook } from "./roadbook/factory";
import type { Roadbook, RoadbookSummary } from "./roadbook/types";

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

export function exportProjectToJson(roadbook: Roadbook): void {
  const blob = new Blob([JSON.stringify(roadbook, null, 2)], { type: "application/json" });
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

/** Parses + minimally validates a roadbook JSON file, assigning a fresh id. */
export async function importProjectFromJson(file: File): Promise<Roadbook> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new InvalidRoadbookFileError("El fitxer no és un JSON vàlid.");
  }
  if (!isRoadbookLike(parsed)) {
    throw new InvalidRoadbookFileError("El fitxer no té l'estructura d'un roadbook.");
  }
  const now = new Date().toISOString();
  const roadbook: Roadbook = recalcRoadbook({
    ...parsed,
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
