import fs from "fs";
import path from "path";
import type { Collection, Document, MongoClient } from "mongodb";

/**
 * Server-only data layer for the dapp.
 *
 * If MONGODB_URI (or MONGO_URI) is set, collections live in MongoDB.
 * Otherwise each collection is a JSON file in the working directory
 * (`app-data-<name>.json`) seeded from lib/appSeed.ts — same pattern as
 * emails.txt / airdrop-applications.json.
 *
 * Do NOT import from client components.
 */

let clientPromise: Promise<MongoClient> | null = null;

function mongoUri() {
  return process.env.MONGODB_URI || process.env.MONGO_URI || "";
}

async function getMongoCollection(name: string): Promise<Collection<Document> | null> {
  const uri = mongoUri();
  if (!uri) return null;
  if (!clientPromise) {
    const { MongoClient } = await import("mongodb");
    clientPromise = new MongoClient(uri).connect();
  }
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB;
  const db = dbName ? client.db(dbName) : client.db();
  return db.collection(name);
}

function filePath(name: string) {
  return path.join(process.cwd(), `app-data-${name}.json`);
}

/** Read a collection; seeds it (Mongo) / falls back to seed (file) when empty. */
export async function readCollection<T>(name: string, seed: T[]): Promise<T[]> {
  try {
    const col = await getMongoCollection(name);
    if (col) {
      const docs = await col.find({}, { projection: { _id: 0 } }).toArray();
      if (docs.length === 0 && seed.length > 0) {
        await col.insertMany(JSON.parse(JSON.stringify(seed)));
        return JSON.parse(JSON.stringify(seed)) as T[];
      }
      return docs as unknown as T[];
    }
  } catch (error) {
    console.error(`Mongo read failed for ${name}, using file store:`, error);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath(name), "utf8")) as T[];
  } catch {
    return JSON.parse(JSON.stringify(seed)) as T[];
  }
}

/** Replace a collection's full contents. */
export async function writeCollection<T>(name: string, items: T[]): Promise<void> {
  const clean = JSON.parse(JSON.stringify(items));
  try {
    const col = await getMongoCollection(name);
    if (col) {
      await col.deleteMany({});
      if (clean.length > 0) await col.insertMany(clean);
      return;
    }
  } catch (error) {
    console.error(`Mongo write failed for ${name}, using file store:`, error);
  }
  fs.writeFileSync(filePath(name), JSON.stringify(clean, null, 2), "utf8");
}

/** Append one item to a collection. */
export async function appendToCollection<T>(
  name: string,
  seed: T[],
  item: T
): Promise<void> {
  const items = await readCollection<T>(name, seed);
  items.push(item);
  await writeCollection(name, items);
}
