import Dexie, { type Table } from "dexie";
import type { Roadbook } from "./roadbook/types";

/**
 * Local-first persistence. Each roadbook is stored as one denormalized
 * record, which keeps the schema trivial today and maps directly onto a
 * future "PUT /roadbooks/{id}" cloud endpoint (same shape, same id) without
 * a data migration.
 */
class RoadbookDatabase extends Dexie {
  roadbooks!: Table<Roadbook, string>;

  constructor() {
    super("rally-roadbook");
    this.version(1).stores({
      // id is the primary key; updatedAt is indexed for "most recent first" listing.
      roadbooks: "id, updatedAt, name",
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
