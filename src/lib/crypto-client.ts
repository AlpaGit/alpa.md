/**
 * Client-side crypto utilities using WebCrypto API.
 * Used for deterministic password derivation, encryption, and decryption
 * so the server never sees plaintext or passwords.
 */

const KDF_ITERATIONS = 310_000;
const KDF_KEY_LENGTH = 32; // 256 bits (AES-256)
const IV_BYTES = 12;
const SALT_BYTES = 16;

/**
 * URL-safe alphanumeric charset excluding ambiguous characters.
 * Must match server-side PASSWORD_CHARSET for consistency.
 */
const PASSWORD_CHARSET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PASSWORD_LENGTH = 24;

// ---------------------------------------------------------------------------
// Normalization (mirrors server-side validation.ts normalizeText + trim)
// ---------------------------------------------------------------------------

/** Normalize markdown: CRLF → LF, strip control chars (except \\n \\t), trim */
export function normalizeMarkdown(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\r\n/g, "\n").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

/** SHA-256 hash of a string, returned as lowercase hex */
export async function hashContent(text: string): Promise<string> {
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Deterministic password derivation
// ---------------------------------------------------------------------------

/**
 * Derive a deterministic 24-character password from a content hash.
 * Uses HKDF-SHA256 with a fixed info string so identical content
 * always produces the same password without storing anything.
 */
export async function derivePassword(contentHash: string): Promise<string> {
  const encoder = new TextEncoder();

  // Import the content hash as HKDF key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(contentHash),
    "HKDF",
    false,
    ["deriveBits"],
  );

  // Derive enough bits to fill PASSWORD_LENGTH characters
  // Each char needs ~6 bits (charset length 51), but we use rejection
  // sampling so derive extra. 256 bits (32 bytes) is plenty for 24 chars.
  const derived = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("alpa.md-v2"),
      info: encoder.encode("password-derivation"),
    },
    keyMaterial,
    256, // 32 bytes
  );

  // Map derived bytes to password charset using rejection sampling
  const bytes = new Uint8Array(derived);
  const maxValid = 256 - (256 % PASSWORD_CHARSET.length);
  const result: string[] = [];
  let idx = 0;

  while (result.length < PASSWORD_LENGTH) {
    if (idx < bytes.length) {
      if (bytes[idx] < maxValid) {
        result.push(PASSWORD_CHARSET[bytes[idx] % PASSWORD_CHARSET.length]);
      }
      idx++;
    } else {
      // Extremely unlikely: need more bytes. Derive additional round.
      const extra = await crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          salt: encoder.encode("alpa.md-v2-extra"),
          info: encoder.encode(`password-derivation-${idx}`),
        },
        keyMaterial,
        256,
      );
      const extraBytes = new Uint8Array(extra);
      for (const b of extraBytes) {
        if (result.length >= PASSWORD_LENGTH) break;
        if (b < maxValid) {
          result.push(PASSWORD_CHARSET[b % PASSWORD_CHARSET.length]);
        }
      }
      idx = bytes.length; // prevent re-entering first branch
    }
  }

  return result.join("");
}

// ---------------------------------------------------------------------------
// Encryption
// ---------------------------------------------------------------------------

export type ClientEncryptionResult = {
  ciphertextB64: string;
  ivB64: string;
  saltB64: string;
  authTagB64: string;
};

/** Derive AES-256-GCM key from password using PBKDF2-HMAC-SHA256 */
async function deriveAesKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const keyBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt.buffer as ArrayBuffer,
      iterations: KDF_ITERATIONS,
    },
    keyMaterial,
    KDF_KEY_LENGTH * 8,
  );

  return crypto.subtle.importKey("raw", keyBits, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Helper: ArrayBuffer → base64 string */
function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary);
}

/** Helper: base64 string → Uint8Array */
function base64ToBuffer(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt plaintext with AES-256-GCM using a password-derived key.
 * Uses random salt and IV for each encryption (the password itself
 * is deterministic from content, but salt/IV add defense-in-depth).
 */
export async function encryptMarkdown(
  plaintext: string,
  password: string,
): Promise<ClientEncryptionResult> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveAesKey(password, salt);

  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    key,
    encoded,
  );

  // WebCrypto appends the 16-byte auth tag to the ciphertext
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);
  const authTag = encryptedBytes.slice(encryptedBytes.length - 16);

  return {
    ciphertextB64: bufferToBase64(ciphertext.buffer as ArrayBuffer),
    ivB64: bufferToBase64(iv.buffer as ArrayBuffer),
    saltB64: bufferToBase64(salt.buffer as ArrayBuffer),
    authTagB64: bufferToBase64(authTag.buffer as ArrayBuffer),
  };
}

// ---------------------------------------------------------------------------
// Decryption
// ---------------------------------------------------------------------------

/**
 * Decrypt AES-256-GCM ciphertext using a password-derived key.
 * Throws on any failure (wrong password, corrupt data).
 */
export async function decryptMarkdown(
  password: string,
  ciphertextB64: string,
  ivB64: string,
  saltB64: string,
  authTagB64: string,
): Promise<string> {
  const salt = base64ToBuffer(saltB64);
  const iv = base64ToBuffer(ivB64);
  const ciphertext = base64ToBuffer(ciphertextB64);
  const authTag = base64ToBuffer(authTagB64);

  const key = await deriveAesKey(password, salt);

  // WebCrypto expects ciphertext + authTag concatenated
  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext, 0);
  combined.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    key,
    combined,
  );

  return new TextDecoder().decode(decrypted);
}
