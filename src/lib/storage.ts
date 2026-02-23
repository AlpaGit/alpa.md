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
      content_length  INTEGER NOT NULL
    )
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
  const sql = getDb();
  await ensureSchema();
  await sql`
    INSERT INTO documents (
      id, ciphertext_b64, iv_b64, salt_b64, auth_tag_b64,
      kdf_algorithm, kdf_iterations, kdf_key_length,
      created_at_iso, content_length
    ) VALUES (
      ${doc.id}, ${doc.ciphertextB64}, ${doc.ivB64}, ${doc.saltB64}, ${doc.authTagB64},
      ${doc.kdf.algorithm}, ${doc.kdf.iterations}, ${doc.kdf.keyLength},
      ${doc.createdAtIso}, ${doc.contentLength}
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
