"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { nav } from "@/lib/site";

export function NavLinks() {
  return <NavList pathname={usePathname()} />;
}

export function NavList({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Principal" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {nav.map((item) => {
        const active =
          pathname !== null &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`decoration-accent decoration-2 underline-offset-8 transition-colors hover:text-accent ${
              active ? "text-ink underline" : "text-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
