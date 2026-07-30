import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import AccessGate from "@/components/AccessGate";
import ThemeToggle from "@/components/ThemeToggle";
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
  title: "SocialPoster",
  description: "AI-generated daily marketing posts across LinkedIn, Facebook & Instagram",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = window.localStorage.getItem('socialposter_theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]" suppressHydrationWarning>
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md">
          <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-token-md)] bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
                  SP
                </span>
                <span className="text-base font-semibold tracking-tight">
                  SocialPoster
                </span>
              </Link>
              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  href="/"
                  className="rounded-[var(--radius-token-sm)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/business"
                  className="rounded-[var(--radius-token-sm)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                >
                  Business Details
                </Link>
                <Link
                  href="/logo"
                  className="rounded-[var(--radius-token-sm)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
                >
                  Logo Maker
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
            </div>
          </nav>
          <div className="flex items-center gap-1 border-t border-[var(--border)] px-4 py-1.5 sm:hidden">
            <Link
              href="/"
              className="rounded-[var(--radius-token-sm)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
            >
              Dashboard
            </Link>
            <Link
              href="/business"
              className="rounded-[var(--radius-token-sm)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
            >
              Business Details
            </Link>
            <Link
              href="/logo"
              className="rounded-[var(--radius-token-sm)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
            >
              Logo Maker
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          <AccessGate>{children}</AccessGate>
        </main>
      </body>
    </html>
  );
}
