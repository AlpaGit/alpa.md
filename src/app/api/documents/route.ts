import { NextResponse } from "next/server";
import { validateMarkdown, guardCreateBody } from "@/lib/validation";
import {
  generateDocumentId,
  generatePassword,
  encryptMarkdown,
  KDF_PARAMS,
} from "@/lib/crypto";
import { saveDocument, documentExists, purgeExpiredDocuments } from "@/lib/storage";
import type { EncryptedDocument } from "@/types/document";
import type { CreateDocumentResponse, ApiError } from "@/types/document";

const MAX_ID_ATTEMPTS = 5;

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

    const validation = validateMarkdown(body.markdown);
    if (!validation.valid) {
      return NextResponse.json<ApiError>(
        { error: validation.message, code: validation.code },
        { status: 400 },
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

    const password = generatePassword();
    const encrypted = encryptMarkdown(validation.markdown, password);

    const doc: EncryptedDocument = {
      id: documentId,
      ciphertextB64: encrypted.ciphertextB64,
      ivB64: encrypted.ivB64,
      saltB64: encrypted.saltB64,
      authTagB64: encrypted.authTagB64,
      kdf: KDF_PARAMS,
      createdAtIso: new Date().toISOString(),
      contentLength: Buffer.byteLength(validation.markdown, "utf-8"),
    };

    await saveDocument(doc);

    // Opportunistic cleanup — non-blocking, don't let it fail the request
    purgeExpiredDocuments().catch(() => {});

    return NextResponse.json<CreateDocumentResponse>(
      {
        documentId,
        readUrl: `/r/${documentId}`,
        password,
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
