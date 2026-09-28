import { describe, expect, it } from "vitest";
import { createStarterRoadbook } from "@/lib/roadbook/factory";
import { useRoadbookStore } from "./roadbook-store";

function setup() {
  const roadbook = createStarterRoadbook("Import test", 1);
  const stageId = roadbook.stages[0].id;
  const sectorId = roadbook.stages[0].sectors[0].id;
  useRoadbookStore.setState({ roadbook, selectedStageId: stageId, selectedSectorId: sectorId });
  return { stageId, sectorId };
}

describe("importInstructions", () => {
  it("appends every partial in order and recalculates km through the existing chain", () => {
    const { stageId, sectorId } = setup();

    useRoadbookStore.getState().importInstructions(stageId, sectorId, [
      { distance: 1, information: "A" },
      { distance: 2.5, information: "B" },
      { distance: 0.5, information: "C" },
    ]);

    const sector = useRoadbookStore.getState().roadbook!.stages[0].sectors[0];
    expect(sector.instructions.map((i) => i.information)).toEqual(["A", "B", "C"]);
    expect(sector.instructions.map((i) => i.order)).toEqual([1, 2, 3]);
    expect(sector.instructions.map((i) => i.totalKm)).toEqual([1, 3.5, 4]);
  });

  it("appends after any instructions the sector already had", () => {
    const { stageId, sectorId } = setup();
    useRoadbookStore.getState().addInstruction(stageId, sectorId, null, { distance: 2 });

    useRoadbookStore.getState().importInstructions(stageId, sectorId, [{ distance: 3, information: "Imported" }]);

    const sector = useRoadbookStore.getState().roadbook!.stages[0].sectors[0];
    expect(sector.instructions).toHaveLength(2);
    expect(sector.instructions[1].information).toBe("Imported");
    expect(sector.instructions[1].totalKm).toBe(5);
  });

  it("does nothing when the sector doesn't exist", () => {
    const { stageId } = setup();
    useRoadbookStore.getState().importInstructions(stageId, "missing-sector", [{ distance: 1 }]);
    expect(useRoadbookStore.getState().roadbook!.stages[0].sectors[0].instructions).toHaveLength(0);
  });

  it("is a no-op with an empty list", () => {
    const { stageId, sectorId } = setup();
    useRoadbookStore.getState().importInstructions(stageId, sectorId, []);
    expect(useRoadbookStore.getState().roadbook!.stages[0].sectors[0].instructions).toHaveLength(0);
  });
});
