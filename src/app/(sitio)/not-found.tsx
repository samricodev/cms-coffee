import Link from "next/link";

import { Stamp } from "@/components/site/stamp";
import { buttonPrimary, eyebrow } from "@/components/site/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-10 py-10 sm:flex-row sm:items-center">
      <Stamp text="Error 404 · Página no encontrada · " className="size-40 shrink-0 rotate-6 text-accent" />
      <div className="space-y-4">
        <p className={`${eyebrow} text-accent`}>404</p>
        <h1 className="font-display text-5xl leading-tight">Esta página no existe</h1>
        <p className="text-lg text-muted">
          Puede que la hayamos movido o que el enlace esté mal escrito.
        </p>
        <Link href="/" className={buttonPrimary}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
