import Link from "next/link";
import { Suspense } from "react";

import { NavLinks, NavList } from "@/components/site/nav-links";
import { Bean } from "@/components/site/stamp";
import { eyebrow } from "@/components/site/ui";
import { site } from "@/lib/site";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-10 gap-y-4 px-5 py-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-accent text-paper transition-transform motion-safe:group-hover:rotate-12">
              <Bean className="size-5" />
            </span>
            <span className="font-display text-2xl tracking-tight">{site.name}</span>
          </Link>

          <Suspense fallback={<NavList pathname={null} />}>
            <NavLinks />
          </Suspense>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        {children}
      </main>

      <footer className="bg-deep text-deep-ink">
        <div className="mx-auto grid max-w-5xl gap-10 px-5 py-14 sm:grid-cols-[1.6fr_1fr_1fr] sm:px-8">
          <div className="space-y-3">
            <p className="flex items-center gap-2.5 font-display text-2xl">
              <Bean className="size-6 text-deep-accent" />
              {site.name}
            </p>
            <p className="max-w-xs text-sm opacity-80">{site.tagline}</p>
          </div>

          <div className="space-y-3 text-sm">
            <p className={`${eyebrow} text-deep-accent`}>Visítanos</p>
            <ul className="space-y-1.5">
              <li>
                <Link href="/como-llegar" className="hover:text-deep-accent">
                  Cómo llegar
                </Link>
              </li>
              <li>
                <Link href="/quienes-somos" className="hover:text-deep-accent">
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link href="/eventos" className="hover:text-deep-accent">
                  Catas y eventos
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <p className={`${eyebrow} text-deep-accent`}>Síguenos</p>
            <ul className="space-y-1.5">
              <li>
                <a href="/feed.xml" className="hover:text-deep-accent">
                  El diario por RSS
                </a>
              </li>
              <li>
                <Link href="/admin" className="opacity-60 hover:text-deep-accent hover:opacity-100">
                  Panel
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
