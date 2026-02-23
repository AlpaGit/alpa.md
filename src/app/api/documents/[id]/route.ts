import { NextResponse } from "next/server";
import { getDocumentById } from "@/lib/storage";
import type { EncryptedDocumentResponse, ApiError } from "@/types/document";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const doc = await getDocumentById(id);
    if (!doc) {
      return NextResponse.json<ApiError>(
        { error: "Document not found.", code: "not_found" },
        { status: 404 },
      );
    }

    return NextResponse.json<EncryptedDocumentResponse>({
      ciphertextB64: doc.ciphertextB64,
      ivB64: doc.ivB64,
      saltB64: doc.saltB64,
      authTagB64: doc.authTagB64,
      kdf: doc.kdf,
    });
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Internal server error.", code: "server_error" },
      { status: 500 },
    );
  }
}
