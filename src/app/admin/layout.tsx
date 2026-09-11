import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { logoutAction } from "@/app/admin/actions";
import { AdminNav, AdminNavActive, type AdminNavGroup } from "@/components/admin-nav";
import { Bean } from "@/components/site/stamp";
import { getSessionUser } from "@/lib/auth/session";
import { listContentTypes } from "@/lib/content-types";
import { site } from "@/lib/site";

export const metadata = { title: "Panel · CMS" };
export const instant = false;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const types = await listContentTypes();

  const groups: AdminNavGroup[] = [
    {
      title: "Contenido",
      items: [
        { href: "/admin", label: "Resumen" },
        ...types.map((type) => ({
          href: `/admin/content/${type.apiId}`,
          label: type.name,
        })),
      ],
    },
    {
      title: "Gestión",
      items: [
        ...(user.role === "admin"
          ? [
              { href: "/admin/types", label: "Tipos" },
              { href: "/admin/users", label: "Usuarios" },
            ]
          : []),
        { href: "/admin/media", label: "Medios" },
      ],
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-surface/60 text-ink md:flex-row">
      <aside className="flex flex-col bg-deep text-deep-ink md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:overflow-y-auto">
        <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-full bg-deep-accent text-deep">
            <Bean className="size-5" />
          </span>
          <span>
            <span className="block font-display text-xl leading-none">{site.name}</span>
            <span className="mt-1 block text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-deep-ink/60">
              Panel
            </span>
          </span>
        </Link>

        <Suspense fallback={<AdminNav groups={groups} pathname={null} />}>
          <AdminNavActive groups={groups} />
        </Suspense>

        <div className="flex items-center gap-4 border-t border-deep-ink/15 px-5 py-4 text-sm md:mt-auto md:flex-col md:items-start md:gap-3">
          <Link href="/admin/cuenta" className="min-w-0 hover:text-deep-accent">
            <span className="block truncate font-semibold">{user.name}</span>
            <span className="block text-xs text-deep-ink/60">
              {user.role === "admin" ? "Administrador" : "Editor"}
            </span>
          </Link>
          <div className="ml-auto flex gap-4 md:ml-0">
            <Link href="/" className="text-deep-ink/75 hover:text-deep-accent">
              Ver sitio
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="text-deep-ink/75 hover:text-deep-accent">
                Salir
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-10 sm:py-10">
        {children}
      </main>
    </div>
  );
}
