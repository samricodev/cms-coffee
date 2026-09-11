import type { ReactNode } from "react";

import { dateParts } from "@/lib/format";

export function Ticket({ date, children }: { date: unknown; children: ReactNode }) {
  const parts = dateParts(date);

  return (
    <div className="flex h-full overflow-hidden rounded-sm bg-surface">
      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-paper bg-accent py-5 text-paper sm:w-24">
        <span className="font-display text-4xl leading-none">{parts?.day ?? "—"}</span>
        <span className="mt-1.5 text-xs font-semibold uppercase tracking-[0.16em]">
          {parts?.month ?? ""}
        </span>
      </div>
      <div className="min-w-0 flex-1 p-5">{children}</div>
    </div>
  );
}
