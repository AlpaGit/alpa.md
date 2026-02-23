import { randomBytes, createHmac } from "node:crypto";

const DOCUMENT_ID_CHARSET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const DOCUMENT_ID_LENGTH = 12;

/**
 * Generate a cryptographically secure random string from a given charset.
 * Uses rejection sampling to avoid modulo bias.
 */
function secureRandomString(length: number, charset: string): string {
  const maxValid = 256 - (256 % charset.length);
  const result: string[] = [];

  while (result.length < length) {
    const bytes = randomBytes(length - result.length);
    for (const byte of bytes) {
      if (byte < maxValid && result.length < length) {
        result.push(charset[byte % charset.length]);
      }
    }
  }

  return result.join("");
}

/** Generate a 12-character URL-safe document ID */
export function generateDocumentId(): string {
  return secureRandomString(DOCUMENT_ID_LENGTH, DOCUMENT_ID_CHARSET);
}

/**
 * Compute a blinded dedupe tag from a client-provided content hash.
 * Uses HMAC-SHA256 with a server-side pepper so raw content hashes
 * are never stored — a DB breach won't allow offline existence checks.
 * Falls back to raw hash if DEDUPE_PEPPER is not set (dev mode).
 */
export function computeDedupeTag(contentHash: string): string {
  const pepper = process.env.DEDUPE_PEPPER;
  if (!pepper) return contentHash;
  return createHmac("sha256", pepper).update(contentHash).digest("hex");
}

/** KDF parameters exposed for storage records */
export const KDF_PARAMS = {
  algorithm: "pbkdf2-sha256" as const,
  iterations: 310_000,
  keyLength: 32,
};
