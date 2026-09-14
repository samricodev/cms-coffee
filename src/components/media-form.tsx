"use client";

import { useActionState, useState } from "react";

import { uploadMediaAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm } from "@/lib/form";
import { MEDIA_TYPES, mediaProblem } from "@/lib/media-limits";

export function MediaForm() {
  const [state, action] = useActionState(uploadMediaAction, idleForm);
  const [problema, setProblema] = useState<string | null>(null);

  return (
    <form action={action} className="space-y-4">
      {problema ? null : <FormMessage state={state} />}

      <div>
        <label className={label} htmlFor="file">
          Archivo
        </label>
        <input
          className={`${input} cursor-pointer py-1.5 text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-surface file:px-3.5 file:py-1.5 file:text-sm file:font-semibold file:text-accent hover:file:bg-accent/10`}
          id="file"
          name="file"
          type="file"
          accept={Object.keys(MEDIA_TYPES).join(",")}
          required
          onChange={(event) => {
            const file = event.target.files?.[0];
            setProblema(file ? mediaProblem(file) : null);
          }}
        />
        <p className="mt-1 text-xs text-muted">
          Imágenes o PDF, hasta 5 MB.
        </p>
        {problema ? (
          <p className="mt-1 text-xs text-red-600">{problema}</p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Subiendo…" disabled={problema !== null}>
        Subir
      </SubmitButton>
    </form>
  );
}
