import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/app/admin/actions";
import { getSessionUser } from "@/lib/auth/session";

export const metadata = { title: "Panel · CMS" };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-black/10 dark:border-white/15">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 p-4 text-sm">
          <Link href="/admin" className="font-semibold">
            CMS
          </Link>
          <Link href="/admin" className="hover:underline">
            Contenido
          </Link>
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
