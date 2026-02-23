export default function Home() {
  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-4">
      <div className="max-w-[65ch]">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter leading-none text-zinc-900">
          Secret Markdown Reader
        </h1>
        <p className="mt-4 text-base text-zinc-500 leading-relaxed">
          Share markdown documents protected by a password. Nothing is stored in
          plaintext.
        </p>
      </div>
    </main>
  );
}
