import Link from "next/link";

import { card, secondary } from "@/components/ui";

export function Forbidden({
  message = "No tienes permiso para ver esta sección.",
}: {
  message?: string;
}) {
  return (
    <div className={`${card} space-y-4`}>
      <h1 className="font-display text-2xl">Sin permiso</h1>
      <p className="text-sm text-muted">{message}</p>
      <Link href="/admin" className={secondary}>
        Volver al panel
      </Link>
    </div>
  );
}
