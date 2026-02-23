import { neon } from "@neondatabase/serverless";
import type { EncryptedDocument } from "@/types/document";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  return neon(url);
}

/** Run once at startup or deploy — creates the documents table if missing */
export async function ensureSchema(): Promise<void> {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS documents (
      id              TEXT PRIMARY KEY,
      ciphertext_b64  TEXT NOT NULL,
      iv_b64          TEXT NOT NULL,
      salt_b64        TEXT NOT NULL,
      auth_tag_b64    TEXT NOT NULL,
      kdf_algorithm   TEXT NOT NULL,
      kdf_iterations  INTEGER NOT NULL,
      kdf_key_length  INTEGER NOT NULL,
      created_at_iso  TEXT NOT NULL,
      content_length  INTEGER NOT NULL,
      dedupe_tag      TEXT NOT NULL DEFAULT ''
    )
  `;
  // Idempotent migration for existing tables
  await sql`
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS dedupe_tag TEXT NOT NULL DEFAULT ''
  `;
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
  dedupe_tag: string;
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
    dedupeTag: row.dedupe_tag,
  };
}

const EXPIRY_HOURS = 48;

/** Check whether a document ID already exists */
export async function documentExists(id: string): Promise<boolean> {
  const sql = getDb();
  await ensureSchema();
  const rows = await sql`SELECT 1 FROM documents WHERE id = ${id} LIMIT 1`;
  return rows.length > 0;
}

/** Find a non-expired document by dedupe tag, or null if none exists */
export async function findByDedupeTag(
  tag: string,
): Promise<EncryptedDocument | null> {
  const sql = getDb();
  await ensureSchema();
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const rows = await sql`
    SELECT * FROM documents
    WHERE dedupe_tag = ${tag}
      AND created_at_iso >= ${cutoff}
    ORDER BY created_at_iso DESC
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return rowToDocument(rows[0] as DocumentRow);
}

/** Persist an encrypted document record */
export async function saveDocument(doc: EncryptedDocument): Promise<void> {
  const sql = getDb();
  await ensureSchema();
  await sql`
    INSERT INTO documents (
      id, ciphertext_b64, iv_b64, salt_b64, auth_tag_b64,
      kdf_algorithm, kdf_iterations, kdf_key_length,
      created_at_iso, content_length, dedupe_tag
    ) VALUES (
      ${doc.id}, ${doc.ciphertextB64}, ${doc.ivB64}, ${doc.saltB64}, ${doc.authTagB64},
      ${doc.kdf.algorithm}, ${doc.kdf.iterations}, ${doc.kdf.keyLength},
      ${doc.createdAtIso}, ${doc.contentLength}, ${doc.dedupeTag}
    )
  `;
}

/** Retrieve an encrypted document by ID, or null if not found */
export async function getDocumentById(
  id: string,
): Promise<EncryptedDocument | null> {
  const sql = getDb();
  await ensureSchema();
  const rows = await sql`SELECT * FROM documents WHERE id = ${id}`;
  if (rows.length === 0) return null;
  return rowToDocument(rows[0] as DocumentRow);
}

/** Delete all documents older than 48 hours. Returns the number of deleted rows. */
export async function purgeExpiredDocuments(): Promise<number> {
  const sql = getDb();
  await ensureSchema();
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const rows = await sql`DELETE FROM documents WHERE created_at_iso < ${cutoff} RETURNING id`;
  return rows.length;
}
