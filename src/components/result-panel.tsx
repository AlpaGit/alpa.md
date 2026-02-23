"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeSlash, Link as LinkIcon } from "@phosphor-icons/react";

type ResultPanelProps = {
  readUrl: string;
  password: string;
  onReset: () => void;
};

function useCopyButton(text: string) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore if clipboard API fails
    }
  }

  return { copied, copy };
}

export default function ResultPanel({ readUrl, password, onReset }: ResultPanelProps) {
  const [showPassword, setShowPassword] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullUrl = `${origin}${readUrl}`;
  const fullUrlWithPassword = `${fullUrl}#${password}`;

  const urlCopy = useCopyButton(fullUrl);
  const urlWithPasswordCopy = useCopyButton(fullUrlWithPassword);
  const passwordCopy = useCopyButton(password);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-accent-200 bg-accent-50/40 px-6 py-5 space-y-6">
        <p className="text-xs font-medium uppercase tracking-widest text-accent-700">
          Document created
        </p>

        {/* Read URL */}
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
            Shareable link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 min-w-0">
              <LinkIcon size={16} weight="duotone" className="text-zinc-400 shrink-0" />
              <span className="text-sm font-mono text-zinc-700 truncate">
                {fullUrl}
              </span>
            </div>
            <button
              type="button"
              onClick={urlCopy.copy}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 active:scale-[0.98] transition-colors"
              aria-label="Copy link"
            >
              {urlCopy.copied ? (
                <Check size={14} weight="bold" className="text-accent-600" />
              ) : (
                <Copy size={14} weight="duotone" className="text-zinc-400" />
              )}
              {urlCopy.copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Link with embedded password */}
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
            Link with password
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 min-w-0">
              <LinkIcon size={16} weight="duotone" className="text-zinc-400 shrink-0" />
              <span className="text-sm font-mono text-zinc-700 truncate">
                {fullUrl}#••••••
              </span>
            </div>
            <button
              type="button"
              onClick={urlWithPasswordCopy.copy}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 active:scale-[0.98] transition-colors"
              aria-label="Copy link with embedded password"
            >
              {urlWithPasswordCopy.copied ? (
                <Check size={14} weight="bold" className="text-accent-600" />
              ) : (
                <Copy size={14} weight="duotone" className="text-zinc-400" />
              )}
              {urlWithPasswordCopy.copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Opens and decrypts automatically. The password stays in the hash fragment and never reaches the server.
          </p>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-widest text-zinc-500">
            Password
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 min-w-0">
              <span className="text-sm font-mono text-zinc-700 truncate select-all">
                {showPassword ? password : "\u2022".repeat(24)}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 p-0.5 rounded text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlash size={16} weight="duotone" />
                ) : (
                  <Eye size={16} weight="duotone" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={passwordCopy.copy}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 active:scale-[0.98] transition-colors"
              aria-label="Copy password"
            >
              {passwordCopy.copied ? (
                <Check size={14} weight="bold" className="text-accent-600" />
              ) : (
                <Copy size={14} weight="duotone" className="text-zinc-400" />
              )}
              {passwordCopy.copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            This password is shown once. Save it before leaving.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        Create another document
      </button>
    </div>
  );
}
