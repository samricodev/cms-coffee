import Link from "next/link";

import { nav, site } from "@/lib/site";

export default function SiteLayout({ children }: LayoutProps<"/"> ) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-6 gap-y-3 px-5 py-5 sm:px-8">
          <Link href="/" className="font-display text-2xl tracking-tight">
            {site.name}
          </Link>

          <nav className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-6 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted sm:px-8">
          <span>{site.name}</span>
          <Link href="/como-llegar" className="hover:text-accent">
            Cómo llegar
          </Link>
          <Link href="/admin" className="ml-auto hover:text-accent">
            Panel
          </Link>
        </div>
      </footer>
    </div>
  );
}
