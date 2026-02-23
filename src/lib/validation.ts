const MAX_MARKDOWN_BYTES = 200 * 1024; // 200 KB

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

  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return {
      valid: false,
      code: "empty_markdown",
      message: "Markdown content cannot be empty.",
    };
  }

  const byteLength = Buffer.byteLength(trimmed, "utf-8");
  if (byteLength > MAX_MARKDOWN_BYTES) {
    return {
      valid: false,
      code: "too_large",
      message: `Content is too large (${(byteLength / 1024).toFixed(1)} KB). Maximum is 200 KB.`,
    };
  }

  return { valid: true, markdown: trimmed };
}

/** Validate the password field on the decrypt endpoint */
export function validatePassword(raw: unknown): { valid: true; password: string } | { valid: false; code: "missing_password"; message: string } {
  if (typeof raw !== "string" || raw.length === 0) {
    return {
      valid: false,
      code: "missing_password",
      message: "Password is required.",
    };
  }

  return { valid: true, password: raw };
}
