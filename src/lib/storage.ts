import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { EncryptedDocument } from "@/types/document";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "documents.json");

type DocumentStore = Record<string, EncryptedDocument>;

async function ensureDataDir(): Promise<void> {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

async function readStore(): Promise<DocumentStore> {
  try {
    const raw = await readFile(DB_PATH, "utf-8");
    return JSON.parse(raw) as DocumentStore;
  } catch {
    return {};
  }
}

async function writeStore(store: DocumentStore): Promise<void> {
  await ensureDataDir();
  await writeFile(DB_PATH, JSON.stringify(store, null, 2), "utf-8");
}

/** Persist an encrypted document record */
export async function saveDocument(doc: EncryptedDocument): Promise<void> {
  const store = await readStore();
  store[doc.id] = doc;
  await writeStore(store);
}

/** Retrieve an encrypted document by ID, or null if not found */
export async function getDocumentById(
  id: string,
): Promise<EncryptedDocument | null> {
  const store = await readStore();
  return store[id] ?? null;
}
