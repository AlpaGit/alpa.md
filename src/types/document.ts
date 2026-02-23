/** Persisted encrypted record — never contains plaintext */
export type EncryptedDocument = {
  id: string;
  ciphertextB64: string;
  ivB64: string;
  saltB64: string;
  authTagB64: string;
  kdf: {
    algorithm: "pbkdf2-sha256";
    iterations: number;
    keyLength: number;
  };
  createdAtIso: string;
  contentLength: number;
  dedupeTag: string;
};

/** POST /api/documents — v2 request (client-encrypted payload) */
export type CreateDocumentRequest = {
  ciphertextB64: string;
  ivB64: string;
  saltB64: string;
  authTagB64: string;
  contentHash: string;
  contentLength: number;
};

/** POST /api/documents — response (201) */
export type CreateDocumentResponse = {
  documentId: string;
  readUrl: string;
  deduplicated?: boolean;
};

/** GET /api/documents/[id] — response (encrypted blob for client-side decrypt) */
export type EncryptedDocumentResponse = {
  ciphertextB64: string;
  ivB64: string;
  saltB64: string;
  authTagB64: string;
  kdf: {
    algorithm: "pbkdf2-sha256";
    iterations: number;
    keyLength: number;
  };
};

/** Structured API error body */
export type ApiError = {
  error: string;
  code:
    | "empty_markdown"
    | "too_large"
    | "invalid_format"
    | "not_found"
    | "rate_limited"
    | "server_error";
};
