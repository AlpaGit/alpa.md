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
};

/** POST /api/documents — request */
export type CreateDocumentRequest = {
  markdown: string;
};

/** POST /api/documents — response (201) */
export type CreateDocumentResponse = {
  documentId: string;
  readUrl: string;
  password: string;
};

/** POST /api/documents/[id]/decrypt — request */
export type DecryptDocumentRequest = {
  password: string;
};

/** POST /api/documents/[id]/decrypt — response (200) */
export type DecryptDocumentResponse = {
  markdown: string;
};

/** Structured API error body */
export type ApiError = {
  error: string;
  code:
    | "empty_markdown"
    | "too_large"
    | "invalid_format"
    | "missing_password"
    | "invalid_password"
    | "not_found"
    | "rate_limited"
    | "server_error";
};
