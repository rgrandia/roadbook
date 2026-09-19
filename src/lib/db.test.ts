import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { deleteRoadbookById, getDb, listRoadbooks, loadRoadbookById, saveRoadbook } from "./db";
import { createStarterRoadbook } from "./roadbook/factory";

describe("Dexie persistence", () => {
  beforeEach(async () => {
    const db = getDb();
    await db.roadbooks.clear();
  });

  it("round-trips a roadbook through save/load", async () => {
    const roadbook = createStarterRoadbook("Rally Persistence Test", 2);
    await saveRoadbook(roadbook);

    const loaded = await loadRoadbookById(roadbook.id);
    expect(loaded).toBeDefined();
    expect(loaded?.name).toBe("Rally Persistence Test");
    expect(loaded?.stages).toHaveLength(2);
    expect(loaded?.stages[0].sectors[0].number).toBe(1);
  });

  it("lists roadbooks ordered by most recently updated first", async () => {
    const older = createStarterRoadbook("Older");
    older.updatedAt = new Date(Date.now() - 10_000).toISOString();
    const newer = createStarterRoadbook("Newer");
    newer.updatedAt = new Date().toISOString();

    await saveRoadbook(older);
    await saveRoadbook(newer);

    const all = await listRoadbooks();
    expect(all[0].name).toBe("Newer");
    expect(all[1].name).toBe("Older");
  });

  it("overwrites an existing roadbook when saved again with the same id", async () => {
    const roadbook = createStarterRoadbook("Original name");
    await saveRoadbook(roadbook);

    const updated = { ...roadbook, name: "Renamed" };
    await saveRoadbook(updated);

    const all = await listRoadbooks();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Renamed");
  });

  it("deletes a roadbook by id", async () => {
    const roadbook = createStarterRoadbook("To delete");
    await saveRoadbook(roadbook);
    await deleteRoadbookById(roadbook.id);

    const loaded = await loadRoadbookById(roadbook.id);
    expect(loaded).toBeUndefined();
  });
});
