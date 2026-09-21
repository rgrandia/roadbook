// @vitest-environment node
import { pdf } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { createInstruction, createRoadbook, createSector, createStage } from "@/lib/roadbook/factory";
import { recalcSector } from "@/lib/roadbook/calc";
import { DIRECTION_ORDER } from "@/lib/roadbook/direction-icons";
import type { InstructionCategory } from "@/lib/roadbook/types";
import { RoadbookPdfDocument, buildPrintPages } from "./roadbook-document";

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
      sectionLabel: "Secció A",
      instructions: categories.map((category, i) =>
        createInstruction({
          distance: i + 0.5,
          category,
          direction: i % 2 === 0 ? "left" : "right",
          danger: i === 0,
          destination: i === 0 ? "Sant Gregori\nCartellà" : undefined,
          informationSecondary: i === 0 ? "Keep right" : undefined,
          gpsLat: i === 0 ? "N 41 59.420" : undefined,
          gpsLng: i === 0 ? "E 2 46.462" : undefined,
        }),
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

  it("renders every direction pictogram without throwing", async () => {
    const roadbook = createRoadbook("All directions");
    const stage = createStage({}, 1);
    const sector = recalcSector(
      createSector({
        instructions: DIRECTION_ORDER.map((direction) => createInstruction({ distance: 1, direction })),
      }),
    );
    stage.sectors = [sector];
    roadbook.stages = [stage];

    const buffer = await pdf(<RoadbookPdfDocument roadbook={roadbook} />).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of buffer) chunks.push(chunk as Buffer);
    const bytes = Buffer.concat(chunks);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renders a custom icon (and a dangling customIconId) without throwing", async () => {
    const roadbook = createRoadbook("Custom icon");
    const stage = createStage({}, 1);
    const sector = recalcSector(
      createSector({
        instructions: [
          createInstruction({ distance: 1, direction: "custom", customIconId: "known" }),
          createInstruction({ distance: 1, direction: "custom", customIconId: "missing" }),
        ],
      }),
    );
    stage.sectors = [sector];
    roadbook.stages = [stage];

    const customIcons = [
      {
        id: "known",
        name: "Gir estrany",
        template: { kind: "turn" as const, angle: 100, otherAngles: [-40] },
        createdAt: "2024-01-01",
      },
    ];

    const buffer = await pdf(<RoadbookPdfDocument roadbook={roadbook} customIcons={customIcons} />).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of buffer) chunks.push(chunk as Buffer);
    const bytes = Buffer.concat(chunks);
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("renders a liaison sector's transition bar without throwing", async () => {
    const roadbook = createRoadbook("Liaison");
    const stage = createStage({}, 1);
    const sector = recalcSector(
      createSector({
        sectorType: "liaison",
        startLocation: "Service OUT",
        endLocation: "Zona de Calibració",
        instructions: [createInstruction({ distance: 5 })],
      }),
    );
    stage.sectors = [sector];
    roadbook.stages = [stage];

    const buffer = await pdf(<RoadbookPdfDocument roadbook={roadbook} />).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of buffer) chunks.push(chunk as Buffer);
    expect(Buffer.concat(chunks).length).toBeGreaterThan(0);
  });
});

describe("buildPrintPages", () => {
  it("chunks a sector's instructions into pages of exactly 4, with a shorter last page", () => {
    const roadbook = createRoadbook("Paging");
    const stage = createStage({}, 1);
    const sector = recalcSector(
      createSector({ instructions: Array.from({ length: 9 }, (_, i) => createInstruction({ distance: i + 1 })) }),
    );
    stage.sectors = [sector];
    roadbook.stages = [stage];

    const pages = buildPrintPages(roadbook);
    expect(pages.map((p) => p.instructions.length)).toEqual([4, 4, 1]);
  });

  it("gives every sector its own page run, never mixing two sectors on one page", () => {
    const roadbook = createRoadbook("Paging multi-sector");
    const stage = createStage({}, 1);
    const sectorA = recalcSector(
      createSector({ instructions: Array.from({ length: 5 }, () => createInstruction({ distance: 1 })) }, 1),
    );
    const sectorB = recalcSector(
      createSector({ instructions: Array.from({ length: 2 }, () => createInstruction({ distance: 1 })) }, 2),
    );
    stage.sectors = [sectorA, sectorB];
    roadbook.stages = [stage];

    const pages = buildPrintPages(roadbook);
    expect(pages.map((p) => [p.sector?.id, p.instructions.length])).toEqual([
      [sectorA.id, 4],
      [sectorA.id, 1],
      [sectorB.id, 2],
    ]);
  });

  it("emits a placeholder page for a stage with no sectors and a sector with no instructions", () => {
    const roadbook = createRoadbook("Paging empties");
    const emptyStage = createStage({}, 1);
    const stageWithEmptySector = createStage({}, 2);
    stageWithEmptySector.sectors = [createSector({}, 1)];
    roadbook.stages = [emptyStage, stageWithEmptySector];

    const pages = buildPrintPages(roadbook);
    expect(pages).toHaveLength(2);
    expect(pages[0].sector).toBeNull();
    expect(pages[1].instructions).toEqual([]);
  });
});
