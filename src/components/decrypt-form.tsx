"use client";

import { useState } from "react";
import {
  Eye,
  EyeSlash,
  LockKeyOpen,
  CircleNotch,
  WarningCircle,
  FileX,
  ArrowLeft,
  WifiSlash,
  LockKey,
} from "@phosphor-icons/react";
import MarkdownRenderer from "@/components/markdown-renderer";

type ErrorCode = "not_found" | "invalid_password" | "generic" | "network";

type DecryptStatus =
  | { state: "idle" }
  | { state: "decrypting" }
  | { state: "success"; markdown: string }
  | { state: "error"; message: string; code: ErrorCode };

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
          setStatus({
            state: "error",
            message: "This document doesn\u2019t exist or may have been removed.",
            code: "not_found",
          });
        } else if (code === "invalid_password") {
          setStatus({
            state: "error",
            message: "The password you entered is incorrect. Double-check and try again.",
            code: "invalid_password",
          });
        } else {
          setStatus({
            state: "error",
            message: body?.error ?? "Something went wrong. Please try again.",
            code: "generic",
          });
        }
        return;
      }

      const data = await res.json();
      setStatus({ state: "success", markdown: data.markdown });
    } catch {
      setStatus({
        state: "error",
        message: "Could not reach the server. Check your connection and try again.",
        code: "network",
      });
    }
  }

  if (status.state === "success") {
    return <MarkdownRenderer content={status.markdown} />;
  }

  // Terminal state: document not found
  if (status.state === "error" && status.code === "not_found") {
    return (
      <div className="space-y-8" role="alert" aria-live="polite">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-8 space-y-4">
          <FileX
            size={32}
            weight="duotone"
            className="text-zinc-400"
          />
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Document not found
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-[50ch]">
            {status.message}
          </p>
          <p className="text-xs text-zinc-400">
            The link may be incorrect or the document may no longer be available.
          </p>
        </div>
        <a
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft
            size={14}
            weight="bold"
            className="group-hover:-translate-x-0.5 transition-transform"
          />
          Create a new document
        </a>
      </div>
    );
  }

  // Inline error display for recoverable errors
  const errorConfig = status.state === "error"
    ? status.code === "invalid_password"
      ? {
          icon: <LockKey size={16} weight="duotone" className="text-red-500 shrink-0 mt-0.5" />,
          borderClass: "border-red-200 bg-red-50",
          textClass: "text-red-600",
        }
      : status.code === "network"
        ? {
            icon: <WifiSlash size={16} weight="duotone" className="text-amber-500 shrink-0 mt-0.5" />,
            borderClass: "border-amber-200 bg-amber-50",
            textClass: "text-amber-700",
          }
        : {
            icon: <WarningCircle size={16} weight="duotone" className="text-red-500 shrink-0 mt-0.5" />,
            borderClass: "border-red-200 bg-red-50",
            textClass: "text-red-600",
          }
    : null;

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
              aria-invalid={status.state === "error" && status.code === "invalid_password"}
              aria-describedby={status.state === "error" ? "decrypt-error" : undefined}
              className={`w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm font-mono text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
                status.state === "error" && status.code === "invalid_password"
                  ? "border-red-300"
                  : "border-zinc-200"
              }`}
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
      {status.state === "error" && errorConfig && (
        <div
          id="decrypt-error"
          role="alert"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${errorConfig.borderClass}`}
        >
          {errorConfig.icon}
          <p className={`text-sm ${errorConfig.textClass}`}>{status.message}</p>
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
            {status.state === "error" ? "Try again" : "Decrypt"}
          </>
        )}
      </button>
    </form>
  );
}
