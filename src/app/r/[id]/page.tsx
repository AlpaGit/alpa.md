import type { Metadata } from "next";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import DecryptForm from "@/components/decrypt-form";

export const metadata: Metadata = {
  title: "Protected document",
  description: "This document is encrypted. Enter the password to decrypt and view.",
  robots: { index: false, follow: false },
};

type ReaderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { id } = await params;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-16 md:gap-24 items-start">
      <div className="space-y-16 md:space-y-20">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck
              size={20}
              weight="duotone"
              className="text-accent-600"
            />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              Protected document
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-none text-zinc-950">
            Enter the password
            <br />
            to read this document.
          </h1>

          <p className="mt-6 text-base text-zinc-500 leading-relaxed max-w-[65ch]">
            This document is encrypted. Provide the password that was shared
            with you to decrypt and view the content.
          </p>
        </div>

        {/* Decrypt form */}
        <DecryptForm documentId={id} />
      </div>

      <aside className="hidden md:block pt-4">
        <div className="border-l border-zinc-200 pl-8">
          <p className="text-xs font-mono text-zinc-400 leading-loose">
            Client-side decryption
            <br />
            Password never stored
            <br />
            One-time access key
            <br />
            Zero knowledge server
          </p>
        </div>
      </aside>
    </div>
  );
}
