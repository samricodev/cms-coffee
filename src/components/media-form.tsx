"use client";

import { useActionState } from "react";

import { uploadMediaAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm } from "@/lib/form";

export function MediaForm() {
  const [state, action] = useActionState(uploadMediaAction, idleForm);

  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />

      <div>
        <label className={label} htmlFor="file">
          Archivo
        </label>
        <input
          className={input}
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
          required
        />
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          Imágenes o PDF, hasta 5 MB.
        </p>
      </div>

      <SubmitButton pendingLabel="Subiendo…">Subir</SubmitButton>
    </form>
  );
}
