import { describe, expect, it } from "vitest";
import { createInstruction, createSector } from "./factory";
import {
  recalcSector,
  roadbookSectorCount,
  roadbookTotalDistance,
  sectorEstimatedTimeMinutes,
  sectorTotalDistance,
  withRecalculatedInstructions,
} from "./calc";
import { createRoadbook } from "./factory";
import { createStage } from "./factory";
import type { Instruction } from "./types";

function sector(instructions: Partial<Instruction>[], startKm = 0) {
  return createSector({
    startKm,
    instructions: instructions.map((i) => createInstruction(i)),
  });
}

describe("recalcSector - basic chaining", () => {
  it("accumulates totalKm from startKm through successive distances", () => {
    const s = recalcSector(sector([{ distance: 0.5 }, { distance: 0.4 }, { distance: 0.6 }]));
    expect(s.instructions.map((i) => i.totalKm)).toEqual([0.5, 0.9, 1.5]);
  });

  it("starts the chain from the sector's startKm, not zero", () => {
    const s = recalcSector(sector([{ distance: 1 }, { distance: 2 }], 10));
    expect(s.instructions.map((i) => i.totalKm)).toEqual([11, 13]);
  });

  it("assigns sequential 1-based order regardless of input order field", () => {
    const s = recalcSector(
      sector([
        { distance: 1, order: 99 },
        { distance: 1, order: -3 },
      ]),
    );
    expect(s.instructions.map((i) => i.order)).toEqual([1, 2]);
  });

  it("rounds to 2 decimals to avoid floating point drift", () => {
    const s = recalcSector(sector([{ distance: 0.1 }, { distance: 0.2 }, { distance: 0.1 }]));
    expect(s.instructions[2].totalKm).toBe(0.4);
  });
});

describe("recalcSector - km parcial reset points", () => {
  it("resets partialKm to the row's own distance right after a STOP", () => {
    const s = recalcSector(
      sector([{ distance: 1.5 }, { distance: 0.8 }, { distance: 2.2, category: "stop" }, { distance: 0.4 }]),
    );
    expect(s.instructions.map((i) => i.partialKm)).toEqual([1.5, 2.3, 4.5, 0.4]);
    // totalKm keeps accumulating across the reset point regardless.
    expect(s.instructions.map((i) => i.totalKm)).toEqual([1.5, 2.3, 4.5, 4.9]);
  });

  it("treats start/regroup/control the same as stop for partial resets", () => {
    for (const category of ["start", "regroup", "control"] as const) {
      const s = recalcSector(sector([{ distance: 1, category }, { distance: 0.5 }]));
      expect(s.instructions[1].partialKm).toBe(0.5);
    }
  });
});

describe("recalcSector - lockedKm", () => {
  it("keeps a locked row's totalKm fixed even if earlier distances change", () => {
    const base = sector([{ distance: 1 }, { distance: 1, lockedKm: true, totalKm: 5 }, { distance: 1 }]);
    const s = recalcSector(base);
    // locked row keeps totalKm=5 regardless of chain (1 -> would have been 2)
    expect(s.instructions[1].totalKm).toBe(5);
    // the row after a locked row continues the chain FROM the locked value
    expect(s.instructions[2].totalKm).toBe(6);
  });

  it("does not lock partialKm - it still accumulates through a locked row", () => {
    const base = sector([{ distance: 1 }, { distance: 1, lockedKm: true, totalKm: 5 }]);
    const s = recalcSector(base);
    expect(s.instructions[1].partialKm).toBe(2);
  });
});

describe("withRecalculatedInstructions - structural edits", () => {
  it("recomputes km after inserting a row in the middle", () => {
    const base = recalcSector(sector([{ distance: 1 }, { distance: 1 }, { distance: 1 }]));
    const [a, b, c] = base.instructions;
    const withInsert = withRecalculatedInstructions(base, [a, createInstruction({ distance: 0.5 }), b, c]);
    expect(withInsert.instructions.map((i) => i.totalKm)).toEqual([1, 1.5, 2.5, 3.5]);
    expect(withInsert.instructions.map((i) => i.order)).toEqual([1, 2, 3, 4]);
  });

  it("recomputes km after deleting a row", () => {
    const base = recalcSector(sector([{ distance: 1 }, { distance: 1 }, { distance: 1 }]));
    const [a, , c] = base.instructions;
    const withDelete = withRecalculatedInstructions(base, [a, c]);
    expect(withDelete.instructions.map((i) => i.totalKm)).toEqual([1, 2]);
  });

  it("recomputes km after reordering rows", () => {
    const base = recalcSector(sector([{ distance: 1 }, { distance: 2 }, { distance: 3 }]));
    const [a, b, c] = base.instructions;
    const reordered = withRecalculatedInstructions(base, [c, a, b]);
    // same distances, new order -> totals follow the new sequence
    expect(reordered.instructions.map((i) => i.totalKm)).toEqual([3, 4, 6]);
  });

  it("recomputes km after duplicating a row", () => {
    const base = recalcSector(sector([{ distance: 1 }, { distance: 2 }]));
    const [a, b] = base.instructions;
    const duplicated = withRecalculatedInstructions(base, [a, { ...b, id: "dup" }, b]);
    expect(duplicated.instructions.map((i) => i.totalKm)).toEqual([1, 3, 5]);
  });
});

describe("aggregate distance helpers", () => {
  it("sums instruction distances for a sector total", () => {
    const s = sector([{ distance: 1.25 }, { distance: 2.75 }]);
    expect(sectorTotalDistance(s)).toBe(4);
  });

  it("sums sector totals across stages and roadbook", () => {
    const rb = createRoadbook("Test");
    const stage1 = createStage({}, 1);
    stage1.sectors = [sector([{ distance: 5 }]), sector([{ distance: 3 }])];
    const stage2 = createStage({}, 2);
    stage2.sectors = [sector([{ distance: 10 }])];
    rb.stages = [stage1, stage2];

    expect(roadbookTotalDistance(rb)).toBe(18);
    expect(roadbookSectorCount(rb)).toBe(3);
  });
});

describe("sectorEstimatedTimeMinutes", () => {
  it("prefers a manual override over the speed-derived estimate", () => {
    const s = { ...sector([{ distance: 10 }]), averageSpeedKmh: 50, estimatedTimeMinutes: 42 };
    expect(sectorEstimatedTimeMinutes(s)).toBe(42);
  });

  it("derives time from distance / average speed when no override is set", () => {
    const s = { ...sector([{ distance: 50 }]), averageSpeedKmh: 50 };
    expect(sectorEstimatedTimeMinutes(s)).toBe(60);
  });

  it("returns undefined when neither override nor speed is set", () => {
    const s = sector([{ distance: 10 }]);
    expect(sectorEstimatedTimeMinutes(s)).toBeUndefined();
  });
});
