// @vitest-environment node
import { pdf } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { createInstruction, createRoadbook, createSector, createStage } from "@/lib/roadbook/factory";
import { recalcSector } from "@/lib/roadbook/calc";
import type { InstructionCategory } from "@/lib/roadbook/types";
import { RoadbookPdfDocument } from "./roadbook-document";

function buildSampleRoadbook() {
  const roadbook = createRoadbook("PDF Smoke Test Rally");
  roadbook.settings.rallyName = "Rally de Prova";
  roadbook.settings.organization = "Escuderia Test";
  roadbook.settings.orientation = "portrait";

  const categories: InstructionCategory[] = [
    "normal",
    "start",
    "stop",
    "regroup",
    "control",
    "finish",
    "danger",
    "info",
    "note",
  ];

  const stage = createStage({}, 1);
  const sector = recalcSector(
    createSector({
      instructions: categories.map((category, i) =>
        createInstruction({ distance: i + 0.5, category, direction: i % 2 === 0 ? "left" : "right" }),
      ),
    }),
  );
  stage.sectors = [sector];
  roadbook.stages = [stage];
  return roadbook;
}

describe("RoadbookPdfDocument", () => {
  it("renders to a non-empty PDF buffer without throwing, covering every category", async () => {
    const roadbook = buildSampleRoadbook();
    const buffer = await pdf(<RoadbookPdfDocument roadbook={roadbook} />).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of buffer) chunks.push(chunk as Buffer);
    const bytes = Buffer.concat(chunks);

    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renders an empty roadbook (no stages) without throwing", async () => {
    const roadbook = createRoadbook("Empty");
    const buffer = await pdf(<RoadbookPdfDocument roadbook={roadbook} />).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of buffer) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
  });

  it("renders a landscape multi-stage roadbook without throwing", async () => {
    const roadbook = buildSampleRoadbook();
    roadbook.settings.orientation = "landscape";
    const secondStage = createStage({}, 2);
    secondStage.sectors = [recalcSector(createSector({ instructions: [createInstruction({ distance: 3.2 })] }, 2))];
    roadbook.stages.push(secondStage);

    const buffer = await pdf(<RoadbookPdfDocument roadbook={roadbook} />).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of buffer) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
  });
});
