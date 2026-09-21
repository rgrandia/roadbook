import { beforeEach, describe, expect, it } from "vitest";
import { getDb } from "./db";
import { buildRoadbookExportFile, importProjectFromJson, type RoadbookExportFile } from "./projects";
import { createInstruction, createRoadbook, createSector, createStage } from "./roadbook/factory";
import type { CustomDirectionIcon } from "./roadbook/types";

function jsonFile(data: unknown, name = "roadbook.json"): File {
  return new File([JSON.stringify(data)], name, { type: "application/json" });
}

const customIcon: CustomDirectionIcon = {
  id: "icon-used",
  name: "Gir estrany",
  template: { kind: "turn", angle: 100, otherAngles: [] },
  createdAt: new Date().toISOString(),
};

const unusedIcon: CustomDirectionIcon = {
  id: "icon-unused",
  name: "No fet servir",
  template: { kind: "roundabout", angle: -60 },
  createdAt: new Date().toISOString(),
};

function roadbookUsingCustomIcon() {
  const roadbook = createRoadbook("Amb icona personalitzada");
  const stage = createStage({}, 1);
  stage.sectors = [
    createSector({
      instructions: [createInstruction({ distance: 1, direction: "custom", customIconId: customIcon.id })],
    }),
  ];
  roadbook.stages = [stage];
  return roadbook;
}

beforeEach(async () => {
  const db = getDb();
  await db.roadbooks.clear();
  await db.customIcons.clear();
});

describe("buildRoadbookExportFile", () => {
  it("bundles only the custom icons the roadbook actually uses", async () => {
    await getDb().customIcons.bulkPut([customIcon, unusedIcon]);
    const roadbook = roadbookUsingCustomIcon();

    const file = await buildRoadbookExportFile(roadbook);

    expect(file.roadbook.id).toBe(roadbook.id);
    expect(file.customIcons.map((i) => i.id)).toEqual(["icon-used"]);
  });

  it("bundles no custom icons for a roadbook that doesn't use any", async () => {
    await getDb().customIcons.bulkPut([customIcon, unusedIcon]);
    const roadbook = createRoadbook("Sense icones personalitzades");

    const file = await buildRoadbookExportFile(roadbook);
    expect(file.customIcons).toEqual([]);
  });
});

describe("importProjectFromJson", () => {
  it("round-trips a roadbook and merges its bundled custom icons into the local library", async () => {
    const roadbook = roadbookUsingCustomIcon();
    const exportFile: RoadbookExportFile = { roadbook, customIcons: [customIcon] };

    const imported = await importProjectFromJson(jsonFile(exportFile));

    expect(imported.id).not.toBe(roadbook.id);
    expect(imported.name).toBe(roadbook.name);
    expect(imported.stages[0].sectors[0].instructions[0].customIconId).toBe(customIcon.id);

    const stored = await getDb().customIcons.get(customIcon.id);
    expect(stored?.name).toBe("Gir estrany");
  });

  it("does not overwrite a local custom icon that already exists under the same id", async () => {
    const localCopy: CustomDirectionIcon = { ...customIcon, name: "Nom local, no tocar" };
    await getDb().customIcons.put(localCopy);

    const exportFile: RoadbookExportFile = { roadbook: roadbookUsingCustomIcon(), customIcons: [customIcon] };
    await importProjectFromJson(jsonFile(exportFile));

    const stored = await getDb().customIcons.get(customIcon.id);
    expect(stored?.name).toBe("Nom local, no tocar");
  });

  it("still imports a plain roadbook JSON with no wrapper (files exported before custom icons existed)", async () => {
    const roadbook = createRoadbook("Roadbook antic");

    const imported = await importProjectFromJson(jsonFile(roadbook));

    expect(imported.name).toBe("Roadbook antic");
    expect(imported.id).not.toBe(roadbook.id);
  });
});
