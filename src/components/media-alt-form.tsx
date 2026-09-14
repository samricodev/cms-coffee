"use client";

import { useActionState } from "react";

import { updateMediaAltAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, secondary } from "@/components/ui";
import { idleForm } from "@/lib/form";
import { MAX_ALT_LENGTH } from "@/lib/validation/media";

export function MediaAltForm({ id, alt }: { id: string; alt: string | null }) {
  const [state, action] = useActionState(
    updateMediaAltAction.bind(null, id),
    idleForm,
  );

  return (
    <form action={action} className="space-y-2">
      <label className="block text-xs font-medium" htmlFor={`alt-${id}`}>
        Texto alternativo
      </label>
      <input
        className={`${input} text-sm`}
        id={`alt-${id}`}
        name="alt"
        defaultValue={alt ?? ""}
        maxLength={MAX_ALT_LENGTH}
        placeholder="Taza de espresso sobre un plato negro"
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className={`${secondary} px-3 py-1 text-xs`} pendingLabel="Guardando…">
          Guardar
        </SubmitButton>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
