"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavGroup = {
  title: string;
  items: Array<{ href: string; label: string }>;
};

export function AdminNavActive({ groups }: { groups: AdminNavGroup[] }) {
  return <AdminNav groups={groups} pathname={usePathname()} />;
}

export function AdminNav({
  groups,
  pathname,
}: {
  groups: AdminNavGroup[];
  pathname: string | null;
}) {
  return (
    <nav
      aria-label="Panel"
      className="flex gap-1 overflow-x-auto px-3 pb-3 [scrollbar-none] md:flex-col md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
    >
      {groups.map((group) => (
        <div key={group.title} className="flex gap-1 md:flex-col">
          <p className="px-2.5 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-deep-ink/50 max-md:hidden">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active =
              pathname !== null &&
              (item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  active
                    ? "bg-deep-ink/10 font-semibold text-deep-ink"
                    : "text-deep-ink/75 hover:bg-deep-ink/5 hover:text-deep-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
