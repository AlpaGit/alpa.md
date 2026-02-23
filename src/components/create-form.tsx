"use client";

import { useRef, useState } from "react";
import {
  FileArrowUp,
  X,
  ArrowRight,
  CircleNotch,
} from "@phosphor-icons/react";
import ResultPanel from "@/components/result-panel";

const MAX_SIZE_BYTES = 200 * 1024;
const ACCEPTED_TYPES = [
  "text/markdown",
  "text/plain",
  "text/x-markdown",
];
const ACCEPTED_EXTENSIONS = [".md", ".markdown", ".txt"];

type FormStatus =
  | { state: "idle" }
  | { state: "creating" }
  | { state: "success"; readUrl: string; password: string }
  | { state: "error"; message: string };

function isAcceptedFile(file: File): boolean {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return (
    ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)
  );
}

export default function CreateForm() {
  const [markdown, setMarkdown] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>({ state: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveContent = fileContent ?? markdown;
  const byteSize = new TextEncoder().encode(effectiveContent.trim()).length;
  const isEmpty = effectiveContent.trim().length === 0;
  const isTooLarge = byteSize > MAX_SIZE_BYTES;
  const isCreating = status.state === "creating";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValidationError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAcceptedFile(file)) {
      setValidationError("Unsupported file type. Use .md, .markdown, or .txt files.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const size = new TextEncoder().encode(text.trim()).length;
      if (size > MAX_SIZE_BYTES) {
        setValidationError(`File is too large (${(size / 1024).toFixed(1)} KB). Maximum is 200 KB.`);
        e.target.value = "";
        return;
      }
      setFileContent(text);
      setFileName(file.name);
    };
    reader.onerror = () => {
      setValidationError("Failed to read file.");
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  function clearFile() {
    setFileContent(null);
    setFileName(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValidationError(null);
    const val = e.target.value;
    const size = new TextEncoder().encode(val.trim()).length;
    if (size > MAX_SIZE_BYTES) {
      setValidationError(`Content is too large (${(size / 1024).toFixed(1)} KB). Maximum is 200 KB.`);
    }
    setMarkdown(val);
  }

  async function handleSubmit() {
    if (isEmpty || isTooLarge || isCreating) return;

    setStatus({ state: "creating" });

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: effectiveContent.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error ?? "Something went wrong. Please try again.";
        setStatus({ state: "error", message });
        return;
      }

      const data = await res.json();
      setStatus({
        state: "success",
        readUrl: data.readUrl,
        password: data.password,
      });
    } catch {
      setStatus({
        state: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  function handleReset() {
    setMarkdown("");
    setFileName(null);
    setFileContent(null);
    setValidationError(null);
    setStatus({ state: "idle" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Success state: show result panel
  if (status.state === "success") {
    return (
      <ResultPanel
        readUrl={status.readUrl}
        password={status.password}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* File upload zone */}
      <div className="space-y-2">
        <label
          htmlFor="file-upload"
          className="block text-xs font-medium uppercase tracking-widest text-zinc-500"
        >
          Upload a file
        </label>
        {fileName ? (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
            <FileArrowUp size={18} weight="duotone" className="text-accent-600 shrink-0" />
            <span className="text-sm text-zinc-700 font-mono truncate">
              {fileName}
            </span>
            <button
              type="button"
              onClick={clearFile}
              disabled={isCreating}
              className="ml-auto p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-30"
              aria-label="Remove file"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="file-upload"
            className={`group flex items-center gap-4 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-5 cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors ${isCreating ? "opacity-40 pointer-events-none" : ""}`}
          >
            <FileArrowUp
              size={24}
              weight="duotone"
              className="text-zinc-300 group-hover:text-accent-500 transition-colors"
            />
            <div>
              <p className="text-sm text-zinc-600">
                Drop a <span className="font-mono text-zinc-500">.md</span> or{" "}
                <span className="font-mono text-zinc-500">.txt</span> file here,
                or click to browse
              </p>
              <p className="text-xs text-zinc-400 mt-1">Max 200 KB</p>
            </div>
          </label>
        )}
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept=".md,.markdown,.txt,text/markdown,text/plain"
          onChange={handleFileChange}
          disabled={isCreating}
          className="sr-only"
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 border-t border-zinc-200" />
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">
          or paste
        </span>
        <div className="flex-1 border-t border-zinc-200" />
      </div>

      {/* Textarea */}
      <div className="space-y-2">
        <label
          htmlFor="markdown-input"
          className="block text-xs font-medium uppercase tracking-widest text-zinc-500"
        >
          Paste markdown
        </label>
        <textarea
          id="markdown-input"
          value={markdown}
          onChange={handleTextChange}
          placeholder="# Your secret document&#10;&#10;Start typing or paste markdown here..."
          rows={8}
          disabled={!!fileContent || isCreating}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 font-mono leading-relaxed placeholder:text-zinc-300 resize-y focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        />
        {!fileContent && byteSize > 0 && (
          <p className={`text-xs font-mono ${isTooLarge ? "text-red-500" : "text-zinc-400"}`}>
            {(byteSize / 1024).toFixed(1)} / 200 KB
          </p>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}

      {/* API error */}
      {status.state === "error" && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
        >
          <p className="text-sm text-red-600">{status.message}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isEmpty || isTooLarge || isCreating}
        className="group inline-flex items-center gap-3 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        {isCreating ? (
          <>
            <CircleNotch size={16} weight="bold" className="animate-spin" />
            Creating...
          </>
        ) : (
          <>
            Create Secure Link
            <ArrowRight
              size={16}
              weight="bold"
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </>
        )}
      </button>
    </div>
  );
}
