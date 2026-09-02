import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/admin/actions";
import { getSessionUser } from "@/lib/auth/session";
import { listContentTypes } from "@/lib/content-types";

export const metadata = { title: "Panel · CMS" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const types = await listContentTypes();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-black/10 dark:border-white/15">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 p-4 text-sm">
          <Link href="/admin" className="font-semibold">
            CMS
          </Link>
          <Link href="/admin" className="hover:underline">
            Entradas
          </Link>
          {types.map((type) => (
            <Link
              key={type.id}
              href={`/admin/content/${type.apiId}`}
              className="hover:underline"
            >
              {type.name}
            </Link>
          ))}
          {user.role === "admin" ? (
            <Link href="/admin/types" className="hover:underline">
              Tipos
            </Link>
          ) : null}
          {user.role === "admin" ? (
            <Link href="/admin/users" className="hover:underline">
              Usuarios
            </Link>
          ) : null}
          <Link href="/" className="hover:underline">
            Ver sitio
          </Link>

          <span className="ml-auto text-black/60 dark:text-white/60">
            {user.name} · {user.role}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="hover:underline">
              Salir
            </button>
          </form>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
