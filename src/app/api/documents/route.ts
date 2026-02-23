import { NextResponse } from "next/server";
import { guardCreateBody } from "@/lib/validation";
import { generateDocumentId, computeDedupeTag, KDF_PARAMS } from "@/lib/crypto";
import {
  saveDocument,
  documentExists,
  findByDedupeTag,
  purgeExpiredDocuments,
} from "@/lib/storage";
import type { EncryptedDocument } from "@/types/document";
import type { CreateDocumentResponse, ApiError } from "@/types/document";

const MAX_ID_ATTEMPTS = 5;
const MAX_CONTENT_BYTES = 200 * 1024; // 200 KB

/** Validate the v2 encrypted payload from the client */
function validateEncryptedPayload(
  body: Record<string, unknown>,
): { valid: true; data: { ciphertextB64: string; ivB64: string; saltB64: string; authTagB64: string; contentHash: string; contentLength: number } }
  | { valid: false; error: string; code: "invalid_format" | "too_large" } {
  const { ciphertextB64, ivB64, saltB64, authTagB64, contentHash, contentLength } = body;

  if (
    typeof ciphertextB64 !== "string" || !ciphertextB64 ||
    typeof ivB64 !== "string" || !ivB64 ||
    typeof saltB64 !== "string" || !saltB64 ||
    typeof authTagB64 !== "string" || !authTagB64
  ) {
    return { valid: false, error: "Missing or invalid encryption fields.", code: "invalid_format" };
  }

  if (typeof contentHash !== "string" || !/^[a-f0-9]{64}$/.test(contentHash)) {
    return { valid: false, error: "Invalid content hash.", code: "invalid_format" };
  }

  if (typeof contentLength !== "number" || contentLength <= 0) {
    return { valid: false, error: "Invalid content length.", code: "invalid_format" };
  }

  if (contentLength > MAX_CONTENT_BYTES) {
    return {
      valid: false,
      error: `Content is too large (${(contentLength / 1024).toFixed(1)} KB). Maximum is 200 KB.`,
      code: "too_large",
    };
  }

  return {
    valid: true,
    data: {
      ciphertextB64: ciphertextB64 as string,
      ivB64: ivB64 as string,
      saltB64: saltB64 as string,
      authTagB64: authTagB64 as string,
      contentHash: contentHash as string,
      contentLength: contentLength as number,
    },
  };
}

export async function POST(request: Request) {
  try {
    const sizeError = await guardCreateBody(request);
    if (sizeError) return sizeError;

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json<ApiError>(
        { error: "Invalid request body.", code: "invalid_format" },
        { status: 400 },
      );
    }

    const validation = validateEncryptedPayload(body as Record<string, unknown>);
    if (!validation.valid) {
      return NextResponse.json<ApiError>(
        { error: validation.error, code: validation.code },
        { status: 400 },
      );
    }

    const { data } = validation;

    // Compute blinded dedupe tag (HMAC with server pepper)
    const dedupeTag = computeDedupeTag(data.contentHash);

    // Check for existing non-expired document with same content
    const existing = await findByDedupeTag(dedupeTag);
    if (existing) {
      // Opportunistic cleanup
      purgeExpiredDocuments().catch(() => {});

      return NextResponse.json<CreateDocumentResponse>(
        {
          documentId: existing.id,
          readUrl: `/r/${existing.id}`,
          deduplicated: true,
        },
        { status: 201 },
      );
    }

    // Generate a unique document ID (retry on collision)
    let documentId = "";
    for (let i = 0; i < MAX_ID_ATTEMPTS; i++) {
      const candidate = generateDocumentId();
      if (!(await documentExists(candidate))) {
        documentId = candidate;
        break;
      }
    }
    if (!documentId) {
      return NextResponse.json<ApiError>(
        { error: "Failed to generate a unique document ID. Please try again.", code: "server_error" },
        { status: 500 },
      );
    }

    const doc: EncryptedDocument = {
      id: documentId,
      ciphertextB64: data.ciphertextB64,
      ivB64: data.ivB64,
      saltB64: data.saltB64,
      authTagB64: data.authTagB64,
      kdf: KDF_PARAMS,
      createdAtIso: new Date().toISOString(),
      contentLength: data.contentLength,
      dedupeTag,
    };

    await saveDocument(doc);

    // Opportunistic cleanup — non-blocking
    purgeExpiredDocuments().catch(() => {});

    return NextResponse.json<CreateDocumentResponse>(
      {
        documentId,
        readUrl: `/r/${documentId}`,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Internal server error.", code: "server_error" },
      { status: 500 },
    );
  }
}
