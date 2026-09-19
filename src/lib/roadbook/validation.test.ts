import { describe, expect, it } from "vitest";
import { createInstruction, createSector, createStage } from "./factory";
import { recalcSector } from "./calc";
import { validateSector } from "./validation";

describe("validateSector", () => {
  it("warns about an empty sector", () => {
    const stage = createStage();
    const sector = createSector();
    const warnings = validateSector(stage, sector);
    expect(warnings.some((w) => w.id.endsWith("-empty"))).toBe(true);
  });

  it("flags a negative distance", () => {
    const stage = createStage();
    const sector = recalcSector(createSector({ instructions: [createInstruction({ distance: -1 })] }));
    const warnings = validateSector(stage, sector);
    expect(warnings.some((w) => w.id.endsWith("-negative-distance"))).toBe(true);
  });

  it("flags totalKm decreasing versus the previous row", () => {
    const stage = createStage();
    const sector = recalcSector(
      createSector({
        instructions: [
          createInstruction({ distance: 5, lockedKm: false }),
          createInstruction({ distance: 1, lockedKm: true, totalKm: 1 }),
        ],
      }),
    );
    const warnings = validateSector(stage, sector);
    expect(warnings.some((w) => w.id.endsWith("-km-decreasing"))).toBe(true);
  });

  it("flags a normal instruction missing a direction", () => {
    const stage = createStage();
    const sector = recalcSector(
      createSector({ instructions: [createInstruction({ distance: 1, direction: "none", category: "normal" })] }),
    );
    const warnings = validateSector(stage, sector);
    expect(warnings.some((w) => w.id.endsWith("-missing-direction"))).toBe(true);
  });

  it("does not require a direction for a STOP row", () => {
    const stage = createStage();
    const sector = recalcSector(
      createSector({ instructions: [createInstruction({ distance: 0, direction: "none", category: "stop" })] }),
    );
    const warnings = validateSector(stage, sector);
    expect(warnings.some((w) => w.id.endsWith("-missing-direction"))).toBe(false);
  });

  it("returns no warnings for a clean sector", () => {
    const stage = createStage();
    const sector = recalcSector(
      createSector({
        instructions: [
          createInstruction({ distance: 1, direction: "left" }),
          createInstruction({ distance: 1, direction: "right" }),
        ],
      }),
    );
    expect(validateSector(stage, sector)).toEqual([]);
  });
});
