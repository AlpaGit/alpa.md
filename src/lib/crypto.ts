import { randomBytes } from "node:crypto";

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
