import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-accent">
        404
      </p>
      <h1 className="font-display text-4xl">Esta página no existe</h1>
      <p className="text-muted">
        Puede que la hayamos movido o que el enlace esté mal escrito.
      </p>
      <Link
        href="/"
        className="inline-block font-mono text-[0.7rem] uppercase tracking-[0.14em] text-accent underline-offset-4 hover:underline"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
