import { LockKey } from "@phosphor-icons/react/dist/ssr";
import CreateForm from "@/components/create-form";

export default function Home() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-16 md:gap-24 items-start">
      <div className="space-y-16 md:space-y-20">
        {/* Hero */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <LockKey size={20} weight="duotone" className="text-accent-600" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              Secure sharing
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter leading-none text-zinc-950">
            Share markdown,
            <br />
            keep it secret.
          </h1>

          <p className="mt-6 text-base text-zinc-500 leading-relaxed max-w-[65ch]">
            Upload or paste your markdown, get a password-protected link.
            Your content is encrypted before it ever touches the server.
          </p>
        </div>

        {/* Input form */}
        <CreateForm />
      </div>

      <aside className="hidden md:block pt-4">
        <div className="border-l border-zinc-200 pl-8">
          <p className="text-xs font-mono text-zinc-400 leading-loose">
            AES-256-GCM encryption
            <br />
            PBKDF2 key derivation
            <br />
            Zero plaintext storage
            <br />
            One-time password reveal
          </p>
        </div>
      </aside>
    </div>
  );
}
