import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secret Markdown Reader",
  description:
    "Share password-protected markdown documents securely. No plaintext ever stored.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-zinc-50 text-zinc-950`}
      >
        <div className="min-h-[100dvh] grid grid-rows-[auto_1fr_auto]">
          <header className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 pt-8 md:pt-12">
            <nav className="flex items-center justify-between">
              <a
                href="/"
                className="text-sm font-medium tracking-tight text-zinc-950 hover:text-accent-700 transition-colors"
              >
                secret.md
              </a>
              <span className="text-xs font-mono text-zinc-400 tracking-wide">
                end-to-end encrypted
              </span>
            </nav>
          </header>

          <main className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-24 lg:py-32">
            {children}
          </main>

          <footer className="w-full max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 pb-8 md:pb-12">
            <div className="border-t border-zinc-200 pt-6 flex items-center justify-between">
              <p className="text-xs text-zinc-400">
                Nothing is stored in plaintext. Ever.
              </p>
              <p className="text-xs font-mono text-zinc-300">
                AES-256-GCM
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
