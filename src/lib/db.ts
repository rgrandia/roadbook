import Dexie, { type Table } from "dexie";
import type { CustomDirectionIcon, Roadbook } from "./roadbook/types";

/**
 * Local-first persistence. Each roadbook is stored as one denormalized
 * record, which keeps the schema trivial today and maps directly onto a
 * future "PUT /roadbooks/{id}" cloud endpoint (same shape, same id) without
 * a data migration.
 *
 * customIcons is a separate, browser-wide table (not nested in a roadbook):
 * it's a personal icon library the user builds once and reuses across every
 * roadbook they create in this browser, same as the built-in icon set.
 */
class RoadbookDatabase extends Dexie {
  roadbooks!: Table<Roadbook, string>;
  customIcons!: Table<CustomDirectionIcon, string>;

  constructor() {
    super("rally-roadbook");
    this.version(1).stores({
      // id is the primary key; updatedAt is indexed for "most recent first" listing.
      roadbooks: "id, updatedAt, name",
    });
    this.version(2).stores({
      roadbooks: "id, updatedAt, name",
      customIcons: "id, name, createdAt",
    });
  }
}

let dbInstance: RoadbookDatabase | null = null;

/** Lazily created singleton; guards against SSR (Dexie needs IndexedDB). */
export function getDb(): RoadbookDatabase {
  if (typeof window === "undefined") {
    throw new Error("getDb() can only be called in the browser");
  }
  if (!dbInstance) {
    dbInstance = new RoadbookDatabase();
  }
  return dbInstance;
}

export async function saveRoadbook(roadbook: Roadbook): Promise<void> {
  await getDb().roadbooks.put(roadbook);
}

export async function loadRoadbookById(id: string): Promise<Roadbook | undefined> {
  return getDb().roadbooks.get(id);
}

export async function listRoadbooks(): Promise<Roadbook[]> {
  return getDb().roadbooks.orderBy("updatedAt").reverse().toArray();
}

export async function deleteRoadbookById(id: string): Promise<void> {
  await getDb().roadbooks.delete(id);
}

export async function saveCustomIcon(icon: CustomDirectionIcon): Promise<void> {
  await getDb().customIcons.put(icon);
}

export async function listCustomIcons(): Promise<CustomDirectionIcon[]> {
  return getDb().customIcons.orderBy("createdAt").toArray();
}

export async function deleteCustomIcon(id: string): Promise<void> {
  await getDb().customIcons.delete(id);
}
