import { randomBytes, pbkdf2Sync, createCipheriv } from "node:crypto";

/**
 * URL-safe alphanumeric charset excluding ambiguous characters:
 * Removed: 0, O, 1, l, I
 */
const PASSWORD_CHARSET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PASSWORD_LENGTH = 24;

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

/** Generate a 24-character secure password (URL-safe, no ambiguous chars) */
export function generatePassword(): string {
  return secureRandomString(PASSWORD_LENGTH, PASSWORD_CHARSET);
}

/** Generate a 12-character URL-safe document ID */
export function generateDocumentId(): string {
  return secureRandomString(DOCUMENT_ID_LENGTH, DOCUMENT_ID_CHARSET);
}

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------

const KDF_ITERATIONS = 310_000;
const KDF_KEY_LENGTH = 32; // 256 bits
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type EncryptionResult = {
  ciphertextB64: string;
  ivB64: string;
  saltB64: string;
  authTagB64: string;
};

/** Derive a 256-bit key from a password using PBKDF2-HMAC-SHA256 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return pbkdf2Sync(password, salt, KDF_ITERATIONS, KDF_KEY_LENGTH, "sha256");
}

/**
 * Encrypt plaintext markdown with AES-256-GCM using a password-derived key.
 * Returns base64-encoded ciphertext, IV, salt, and auth tag.
 */
export function encryptMarkdown(
  plaintext: string,
  password: string,
): EncryptionResult {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = deriveKey(password, salt);

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertextB64: encrypted.toString("base64"),
    ivB64: iv.toString("base64"),
    saltB64: salt.toString("base64"),
    authTagB64: authTag.toString("base64"),
  };
}

/** KDF parameters exposed for storage records */
export const KDF_PARAMS = {
  algorithm: "pbkdf2-sha256" as const,
  iterations: KDF_ITERATIONS,
  keyLength: KDF_KEY_LENGTH,
};
