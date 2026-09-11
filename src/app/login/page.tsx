import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { Bean, Stamp } from "@/components/site/stamp";
import { getSessionUser } from "@/lib/auth/session";
import { site } from "@/lib/site";

export const metadata = { title: "Entrar · CMS" };
export const instant = false;

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");

  return (
    <main className="grid min-h-dvh flex-1 bg-paper text-ink md:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-deep p-12 text-deep-ink md:flex">
        <Link href="/" className="flex w-fit items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-deep-accent text-deep">
            <Bean className="size-6" />
          </span>
          <span className="font-display text-2xl">{site.name}</span>
        </Link>

        <div className="relative z-10 max-w-md space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-deep-accent">
            Panel de contenido
          </p>
          <p className="font-display text-4xl leading-tight">{site.tagline}</p>
        </div>

        <Link href="/" className="relative z-10 w-fit text-sm text-deep-ink/70 hover:text-deep-accent">
          <span aria-hidden>←</span> Volver al sitio
        </Link>

        <Stamp
          text="Café de especialidad · Tostado de temporada · "
          className="pointer-events-none absolute -bottom-20 -right-20 size-96 -rotate-12 text-deep-accent/20"
        />
      </section>

      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <Link href="/" className="flex w-fit items-center gap-2.5 md:hidden">
            <span className="grid size-9 place-items-center rounded-full bg-accent text-paper">
              <Bean className="size-5" />
            </span>
            <span className="font-display text-2xl">{site.name}</span>
          </Link>

          <div className="space-y-2">
            <h1 className="font-display text-4xl">Entrar al panel</h1>
            <p className="text-muted">
              Gestiona la carta, los cafés, el diario y los eventos.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-6">
            <LoginForm />
          </div>

          {process.env.NODE_ENV !== "production" ? (
            <p className="rounded-lg bg-surface px-3 py-2 text-xs text-muted">
              Solo en desarrollo · cuentas de ejemplo: admin@cms.local ·
              editor@cms.local
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
