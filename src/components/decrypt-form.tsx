"use client";

import { useState } from "react";
import {
  Eye,
  EyeSlash,
  LockKeyOpen,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";

type DecryptStatus =
  | { state: "idle" }
  | { state: "decrypting" }
  | { state: "success"; markdown: string }
  | { state: "error"; message: string };

type DecryptFormProps = {
  documentId: string;
};

export default function DecryptForm({ documentId }: DecryptFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<DecryptStatus>({ state: "idle" });

  const isDecrypting = status.state === "decrypting";
  const isEmpty = password.length === 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEmpty || isDecrypting) return;

    setStatus({ state: "decrypting" });

    try {
      const res = await fetch(`/api/documents/${documentId}/decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const code = body?.code;

        if (code === "not_found") {
          setStatus({ state: "error", message: "Document not found." });
        } else if (code === "invalid_password") {
          setStatus({ state: "error", message: "Invalid password or data." });
        } else {
          setStatus({
            state: "error",
            message: body?.error ?? "Something went wrong. Please try again.",
          });
        }
        return;
      }

      const data = await res.json();
      setStatus({ state: "success", markdown: data.markdown });
    } catch {
      setStatus({
        state: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  // Success: render markdown (placeholder — P3-T04 will add proper rendering)
  if (status.state === "success") {
    return (
      <div
        id="markdown-output"
        className="prose prose-zinc max-w-none font-sans text-zinc-800 leading-relaxed"
      >
        <pre className="whitespace-pre-wrap text-sm font-mono text-zinc-700 bg-white rounded-xl border border-zinc-200 px-6 py-5">
          {status.markdown}
        </pre>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Password input */}
      <div className="space-y-2">
        <label
          htmlFor="decrypt-password"
          className="block text-xs font-medium uppercase tracking-widest text-zinc-500"
        >
          Password
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              id="decrypt-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Paste the document password"
              disabled={isDecrypting}
              autoComplete="off"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-12 text-sm font-mono text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-400 hover:text-zinc-600 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeSlash size={18} weight="duotone" />
              ) : (
                <Eye size={18} weight="duotone" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {status.state === "error" && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <WarningCircle
            size={18}
            weight="duotone"
            className="text-red-500 shrink-0 mt-0.5"
          />
          <p className="text-sm text-red-600">{status.message}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isEmpty || isDecrypting}
        className="group inline-flex items-center gap-3 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        {isDecrypting ? (
          <>
            <CircleNotch size={16} weight="bold" className="animate-spin" />
            Decrypting...
          </>
        ) : (
          <>
            <LockKeyOpen size={16} weight="duotone" />
            Decrypt
          </>
        )}
      </button>
    </form>
  );
}
