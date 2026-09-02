"use client";

import { card, secondary } from "@/components/ui";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className={`${card} space-y-4`}>
      <h1 className="text-lg font-semibold">Algo ha fallado</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        No hemos podido completar la operación. Inténtalo de nuevo.
      </p>
      <button type="button" onClick={reset} className={secondary}>
        Reintentar
      </button>
    </div>
  );
}
