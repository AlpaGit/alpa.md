import { NextResponse } from "next/server";
import { validatePassword, guardDecryptBody } from "@/lib/validation";
import { getDocumentById } from "@/lib/storage";
import { decryptMarkdown } from "@/lib/crypto";
import type { DecryptDocumentResponse, ApiError } from "@/types/document";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sizeError = await guardDecryptBody(request);
    if (sizeError) return sizeError;

    const { id } = await params;

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json<ApiError>(
        { error: "Invalid request body.", code: "invalid_format" },
        { status: 400 },
      );
    }

    const validation = validatePassword(body.password);
    if (!validation.valid) {
      return NextResponse.json<ApiError>(
        { error: validation.message, code: validation.code },
        { status: 400 },
      );
    }

    const doc = await getDocumentById(id);
    if (!doc) {
      return NextResponse.json<ApiError>(
        { error: "Document not found.", code: "not_found" },
        { status: 404 },
      );
    }

    let markdown: string;
    try {
      markdown = decryptMarkdown(
        validation.password,
        doc.ciphertextB64,
        doc.ivB64,
        doc.saltB64,
        doc.authTagB64,
      );
    } catch {
      return NextResponse.json<ApiError>(
        { error: "Invalid password or data.", code: "invalid_password" },
        { status: 401 },
      );
    }

    return NextResponse.json<DecryptDocumentResponse>({ markdown });
  } catch {
    return NextResponse.json<ApiError>(
      { error: "Internal server error.", code: "server_error" },
      { status: 500 },
    );
  }
}
