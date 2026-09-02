import Link from "next/link";

import { card, secondary } from "@/components/ui";

export function Forbidden({
  message = "No tienes permiso para ver esta sección.",
}: {
  message?: string;
}) {
  return (
    <div className={`${card} space-y-4`}>
      <h1 className="text-lg font-semibold">Sin permiso</h1>
      <p className="text-sm text-black/60 dark:text-white/60">{message}</p>
      <Link href="/admin" className={secondary}>
        Volver al panel
      </Link>
    </div>
  );
}
