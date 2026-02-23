import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync, existsSync } from "node:fs";
import type { EncryptedDocument } from "@/types/document";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "documents.db");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  ensureDataDir();
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id             TEXT PRIMARY KEY,
      ciphertext_b64 TEXT NOT NULL,
      iv_b64         TEXT NOT NULL,
      salt_b64       TEXT NOT NULL,
      auth_tag_b64   TEXT NOT NULL,
      kdf_algorithm  TEXT NOT NULL,
      kdf_iterations INTEGER NOT NULL,
      kdf_key_length INTEGER NOT NULL,
      created_at_iso TEXT NOT NULL,
      content_length INTEGER NOT NULL
    )
  `);

  return _db;
}

type DocumentRow = {
  id: string;
  ciphertext_b64: string;
  iv_b64: string;
  salt_b64: string;
  auth_tag_b64: string;
  kdf_algorithm: "pbkdf2-sha256";
  kdf_iterations: number;
  kdf_key_length: number;
  created_at_iso: string;
  content_length: number;
};

function rowToDocument(row: DocumentRow): EncryptedDocument {
  return {
    id: row.id,
    ciphertextB64: row.ciphertext_b64,
    ivB64: row.iv_b64,
    saltB64: row.salt_b64,
    authTagB64: row.auth_tag_b64,
    kdf: {
      algorithm: row.kdf_algorithm,
      iterations: row.kdf_iterations,
      keyLength: row.kdf_key_length,
    },
    createdAtIso: row.created_at_iso,
    contentLength: row.content_length,
  };
}

/** Persist an encrypted document record */
export async function saveDocument(doc: EncryptedDocument): Promise<void> {
  const db = getDb();
  db.prepare(`
    INSERT INTO documents (
      id, ciphertext_b64, iv_b64, salt_b64, auth_tag_b64,
      kdf_algorithm, kdf_iterations, kdf_key_length,
      created_at_iso, content_length
    ) VALUES (
      @id, @ciphertext_b64, @iv_b64, @salt_b64, @auth_tag_b64,
      @kdf_algorithm, @kdf_iterations, @kdf_key_length,
      @created_at_iso, @content_length
    )
  `).run({
    id: doc.id,
    ciphertext_b64: doc.ciphertextB64,
    iv_b64: doc.ivB64,
    salt_b64: doc.saltB64,
    auth_tag_b64: doc.authTagB64,
    kdf_algorithm: doc.kdf.algorithm,
    kdf_iterations: doc.kdf.iterations,
    kdf_key_length: doc.kdf.keyLength,
    created_at_iso: doc.createdAtIso,
    content_length: doc.contentLength,
  });
}

/** Retrieve an encrypted document by ID, or null if not found */
export async function getDocumentById(
  id: string,
): Promise<EncryptedDocument | null> {
  const db = getDb();
  const row = db.prepare("SELECT * FROM documents WHERE id = ?").get(id) as DocumentRow | undefined;
  return row ? rowToDocument(row) : null;
}
