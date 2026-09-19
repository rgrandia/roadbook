import type { Draft } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { temporal } from "zundo";
import { throttle } from "@/lib/throttle";
import { recalcRoadbook, recalcSector, roadbookSectorCount, roadbookTotalDistance } from "@/lib/roadbook/calc";
import { createInstruction, createSector, createStage, createId } from "@/lib/roadbook/factory";
import type { Instruction, Roadbook, Sector, SectorType, Stage } from "@/lib/roadbook/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface RoadbookState {
  roadbook: Roadbook | null;
  selectedStageId: string | null;
  selectedSectorId: string | null;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;

  loadRoadbook: (roadbook: Roadbook) => void;
  clearRoadbook: () => void;
  select: (stageId: string | null, sectorId: string | null) => void;
  setSaveStatus: (status: SaveStatus, savedAt?: string) => void;

  renameRoadbook: (name: string) => void;
  updateSettings: (partial: Partial<Roadbook["settings"]>) => void;

  addStage: () => string;
  renameStage: (stageId: string, name: string) => void;
  deleteStage: (stageId: string) => void;
  reorderStages: (stageIds: string[]) => void;

  addSector: (stageId: string) => string;
  duplicateSector: (stageId: string, sectorId: string) => string | undefined;
  updateSectorMeta: (
    stageId: string,
    sectorId: string,
    partial: Partial<
      Pick<
        Sector,
        | "name"
        | "sectionLabel"
        | "startLocation"
        | "endLocation"
        | "sectorType"
        | "notes"
        | "startKm"
        | "averageSpeedKmh"
        | "estimatedTimeMinutes"
      >
    >,
  ) => void;
  deleteSector: (stageId: string, sectorId: string) => void;
  reorderSectors: (stageId: string, sectorIds: string[]) => void;

  addInstruction: (
    stageId: string,
    sectorId: string,
    afterInstructionId?: string | null,
    partial?: Partial<Instruction>,
  ) => string | undefined;
  updateInstruction: (stageId: string, sectorId: string, instructionId: string, partial: Partial<Instruction>) => void;
  deleteInstruction: (stageId: string, sectorId: string, instructionId: string) => void;
  duplicateInstruction: (stageId: string, sectorId: string, instructionId: string) => string | undefined;
  reorderInstructions: (stageId: string, sectorId: string, instructionIds: string[]) => void;
  recalcAllKm: () => void;
}

function findStage(roadbook: Draft<Roadbook>, stageId: string) {
  return roadbook.stages.find((s) => s.id === stageId);
}

function findSector(roadbook: Draft<Roadbook>, stageId: string, sectorId: string) {
  const stage = findStage(roadbook, stageId);
  return stage?.sectors.find((s) => s.id === sectorId);
}

function nextSectorNumber(roadbook: Draft<Roadbook>): number {
  let max = 0;
  for (const stage of roadbook.stages) {
    for (const sector of stage.sectors) {
      if (sector.number > max) max = sector.number;
    }
  }
  return max + 1;
}

/** Replaces a sector's instruction list, immediately recalculating km. */
function applyInstructions(sector: Draft<Sector>, instructions: Instruction[]) {
  const recalculated = recalcSector({ ...(sector as Sector), instructions });
  sector.instructions = recalculated.instructions;
}

export const useRoadbookStore = create<RoadbookState>()(
  temporal(
    immer((set) => ({
      roadbook: null,
      selectedStageId: null,
      selectedSectorId: null,
      saveStatus: "idle",
      lastSavedAt: null,

      loadRoadbook: (roadbook) =>
        set((state) => {
          const recalculated = recalcRoadbook(roadbook);
          state.roadbook = recalculated;
          state.selectedStageId = recalculated.stages[0]?.id ?? null;
          state.selectedSectorId = recalculated.stages[0]?.sectors[0]?.id ?? null;
          state.saveStatus = "saved";
          state.lastSavedAt = recalculated.updatedAt;
        }),

      clearRoadbook: () =>
        set((state) => {
          state.roadbook = null;
          state.selectedStageId = null;
          state.selectedSectorId = null;
        }),

      select: (stageId, sectorId) =>
        set((state) => {
          state.selectedStageId = stageId;
          state.selectedSectorId = sectorId;
        }),

      setSaveStatus: (status, savedAt) =>
        set((state) => {
          state.saveStatus = status;
          if (savedAt) state.lastSavedAt = savedAt;
        }),

      renameRoadbook: (name) =>
        set((state) => {
          if (!state.roadbook) return;
          state.roadbook.name = name;
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      updateSettings: (partial) =>
        set((state) => {
          if (!state.roadbook) return;
          Object.assign(state.roadbook.settings, partial);
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      addStage: () => {
        const newId = createId();
        set((state) => {
          if (!state.roadbook) return;
          const stage = createStage({ id: newId }, state.roadbook.stages.length + 1);
          state.roadbook.stages.push(stage);
          state.roadbook.updatedAt = new Date().toISOString();
          state.selectedStageId = stage.id;
          state.selectedSectorId = null;
        });
        return newId;
      },

      renameStage: (stageId, name) =>
        set((state) => {
          if (!state.roadbook) return;
          const stage = findStage(state.roadbook, stageId);
          if (!stage) return;
          stage.name = name;
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      deleteStage: (stageId) =>
        set((state) => {
          if (!state.roadbook) return;
          state.roadbook.stages = state.roadbook.stages.filter((s) => s.id !== stageId);
          state.roadbook.stages.forEach((s, i) => (s.order = i + 1));
          state.roadbook.updatedAt = new Date().toISOString();
          if (state.selectedStageId === stageId) {
            state.selectedStageId = state.roadbook.stages[0]?.id ?? null;
            state.selectedSectorId = state.roadbook.stages[0]?.sectors[0]?.id ?? null;
          }
        }),

      reorderStages: (stageIds) =>
        set((state) => {
          if (!state.roadbook) return;
          const byId = new Map(state.roadbook.stages.map((s) => [s.id, s]));
          state.roadbook.stages = stageIds
            .map((id) => byId.get(id))
            .filter((s): s is Draft<Stage> => !!s)
            .map((s, i) => {
              s.order = i + 1;
              return s;
            });
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      addSector: (stageId) => {
        const newId = createId();
        set((state) => {
          if (!state.roadbook) return;
          const stage = findStage(state.roadbook, stageId);
          if (!stage) return;
          const sector = createSector({ id: newId }, nextSectorNumber(state.roadbook));
          sector.order = stage.sectors.length + 1;
          stage.sectors.push(sector);
          state.roadbook.updatedAt = new Date().toISOString();
          state.selectedStageId = stageId;
          state.selectedSectorId = sector.id;
        });
        return newId;
      },

      duplicateSector: (stageId, sectorId) => {
        let newId: string | undefined;
        set((state) => {
          if (!state.roadbook) return;
          const stage = findStage(state.roadbook, stageId);
          const sector = stage?.sectors.find((s) => s.id === sectorId);
          if (!stage || !sector) return;
          newId = createId();
          const clone: Sector = {
            ...(sector as Sector),
            id: newId,
            name: `${sector.name} (còpia)`,
            number: nextSectorNumber(state.roadbook),
            order: sector.order + 1,
            instructions: sector.instructions.map((i) => ({ ...(i as Instruction), id: createId() })),
          };
          const index = stage.sectors.findIndex((s) => s.id === sectorId);
          stage.sectors.splice(index + 1, 0, clone);
          stage.sectors.forEach((s, i) => (s.order = i + 1));
          state.roadbook.updatedAt = new Date().toISOString();
          state.selectedStageId = stageId;
          state.selectedSectorId = newId;
        });
        return newId;
      },

      updateSectorMeta: (stageId, sectorId, partial) =>
        set((state) => {
          if (!state.roadbook) return;
          const sector = findSector(state.roadbook, stageId, sectorId);
          if (!sector) return;
          Object.assign(sector, partial);
          if ("startKm" in partial) {
            applyInstructions(sector, sector.instructions as Instruction[]);
          }
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      deleteSector: (stageId, sectorId) =>
        set((state) => {
          if (!state.roadbook) return;
          const stage = findStage(state.roadbook, stageId);
          if (!stage) return;
          stage.sectors = stage.sectors.filter((s) => s.id !== sectorId);
          stage.sectors.forEach((s, i) => (s.order = i + 1));
          state.roadbook.updatedAt = new Date().toISOString();
          if (state.selectedSectorId === sectorId) {
            state.selectedSectorId = stage.sectors[0]?.id ?? null;
          }
        }),

      reorderSectors: (stageId, sectorIds) =>
        set((state) => {
          if (!state.roadbook) return;
          const stage = findStage(state.roadbook, stageId);
          if (!stage) return;
          const byId = new Map(stage.sectors.map((s) => [s.id, s]));
          stage.sectors = sectorIds
            .map((id) => byId.get(id))
            .filter((s): s is Draft<Sector> => !!s)
            .map((s, i) => {
              s.order = i + 1;
              return s;
            });
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      addInstruction: (stageId, sectorId, afterInstructionId, partial) => {
        const newId = createId();
        set((state) => {
          if (!state.roadbook) return;
          const sector = findSector(state.roadbook, stageId, sectorId);
          if (!sector) return;
          const instruction = createInstruction({ id: newId, ...partial });
          const list = sector.instructions as Instruction[];
          if (afterInstructionId) {
            const index = list.findIndex((i) => i.id === afterInstructionId);
            list.splice(index + 1, 0, instruction);
          } else {
            list.push(instruction);
          }
          applyInstructions(sector, list);
          state.roadbook.updatedAt = new Date().toISOString();
        });
        return newId;
      },

      updateInstruction: (stageId, sectorId, instructionId, partial) =>
        set((state) => {
          if (!state.roadbook) return;
          const sector = findSector(state.roadbook, stageId, sectorId);
          if (!sector) return;
          const list = sector.instructions as Instruction[];
          const index = list.findIndex((i) => i.id === instructionId);
          if (index === -1) return;
          const current = list[index];

          const next: Instruction = { ...current, ...partial };

          // Editing totalKm by hand (without touching distance/lockedKm) means
          // "nudge this row to this exact value" - back-derive the distance so
          // the chain still reproduces it, per spec section 9.
          if ("totalKm" in partial && !("distance" in partial) && !("lockedKm" in partial)) {
            const previousTotal = index === 0 ? sector.startKm : list[index - 1].totalKm;
            next.distance = Math.round((next.totalKm - previousTotal + Number.EPSILON) * 100) / 100;
            next.lockedKm = false;
          }

          list[index] = next;
          applyInstructions(sector, list);
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      deleteInstruction: (stageId, sectorId, instructionId) =>
        set((state) => {
          if (!state.roadbook) return;
          const sector = findSector(state.roadbook, stageId, sectorId);
          if (!sector) return;
          const list = (sector.instructions as Instruction[]).filter((i) => i.id !== instructionId);
          applyInstructions(sector, list);
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      duplicateInstruction: (stageId, sectorId, instructionId) => {
        let newId: string | undefined;
        set((state) => {
          if (!state.roadbook) return;
          const sector = findSector(state.roadbook, stageId, sectorId);
          if (!sector) return;
          const list = sector.instructions as Instruction[];
          const index = list.findIndex((i) => i.id === instructionId);
          if (index === -1) return;
          newId = createId();
          const clone: Instruction = { ...list[index], id: newId, lockedKm: false };
          list.splice(index + 1, 0, clone);
          applyInstructions(sector, list);
          state.roadbook.updatedAt = new Date().toISOString();
        });
        return newId;
      },

      reorderInstructions: (stageId, sectorId, instructionIds) =>
        set((state) => {
          if (!state.roadbook) return;
          const sector = findSector(state.roadbook, stageId, sectorId);
          if (!sector) return;
          const byId = new Map((sector.instructions as Instruction[]).map((i) => [i.id, i]));
          const reordered = instructionIds.map((id) => byId.get(id)).filter((i): i is Instruction => !!i);
          applyInstructions(sector, reordered);
          state.roadbook.updatedAt = new Date().toISOString();
        }),

      recalcAllKm: () =>
        set((state) => {
          if (!state.roadbook) return;
          state.roadbook = recalcRoadbook(state.roadbook as Roadbook);
          state.roadbook.updatedAt = new Date().toISOString();
        }),
    })),
    {
      partialize: (state) => ({ roadbook: state.roadbook }),
      limit: 100,
      equality: (a, b) => a.roadbook === b.roadbook,
      handleSet: (handleSet) => throttle(handleSet, 500),
    },
  ),
);

export function selectRoadbookSummaryStats(roadbook: Roadbook | null) {
  if (!roadbook) return { sectorCount: 0, totalDistanceKm: 0 };
  return {
    sectorCount: roadbookSectorCount(roadbook),
    totalDistanceKm: roadbookTotalDistance(roadbook),
  };
}

export type SectorTypeOption = SectorType;
