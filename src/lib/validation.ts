import { NextResponse } from "next/server";
import type { ApiError } from "@/types/document";

const MAX_MARKDOWN_BYTES = 200 * 1024; // 200 KB

// Body size limits (bytes) — includes JSON overhead above the markdown limit
const BODY_LIMIT_CREATE = 256 * 1024; // 256 KB

/**
 * Guard against oversized request bodies.
 * Returns a 413 response if the Content-Length exceeds the limit, or null if OK.
 * When Content-Length is absent, the body is read and checked instead.
 */
export async function guardBodySize(
  request: Request,
  maxBytes: number,
): Promise<NextResponse<ApiError> | null> {
  const cl = request.headers.get("content-length");
  if (cl !== null) {
    const size = parseInt(cl, 10);
    if (!Number.isNaN(size) && size > maxBytes) {
      return NextResponse.json<ApiError>(
        { error: "Request body too large.", code: "too_large" },
        { status: 413 },
      );
    }
  }
  return null;
}

/** Pre-configured guard for the create endpoint (256 KB) */
export function guardCreateBody(request: Request) {
  return guardBodySize(request, BODY_LIMIT_CREATE);
}

/** Normalize text: CRLF → LF, strip null bytes and other C0 control chars (except \n \r \t) */
function normalizeText(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\r\n/g, "\n").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

export type ValidationResult =
  | { valid: true; markdown: string }
  | { valid: false; code: "empty_markdown" | "too_large" | "invalid_format"; message: string };

/** Validate and normalize markdown input for the create endpoint */
export function validateMarkdown(raw: unknown): ValidationResult {
  if (typeof raw !== "string") {
    return {
      valid: false,
      code: "invalid_format",
      message: "Markdown must be a string.",
    };
  }

  const normalized = normalizeText(raw).trim();

  if (normalized.length === 0) {
    return {
      valid: false,
      code: "empty_markdown",
      message: "Markdown content cannot be empty.",
    };
  }

  const byteLength = Buffer.byteLength(normalized, "utf-8");
  if (byteLength > MAX_MARKDOWN_BYTES) {
    return {
      valid: false,
      code: "too_large",
      message: `Content is too large (${(byteLength / 1024).toFixed(1)} KB). Maximum is 200 KB.`,
    };
  }

  return { valid: true, markdown: normalized };
}

