"use client";

import { useActionState, useState } from "react";

import { uploadMediaAction } from "@/app/admin/actions";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { input, label } from "@/components/ui";
import { idleForm } from "@/lib/form";

const MAX_BYTES = 5 * 1024 * 1024;

const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
];

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaForm() {
  const [state, action] = useActionState(uploadMediaAction, idleForm);
  const [problema, setProblema] = useState<string | null>(null);

  function revisar(file: File | undefined) {
    if (!file) {
      setProblema(null);
      return;
    }

    if (!ACCEPTED.includes(file.type)) {
      setProblema(`Tipo no permitido: ${file.type || "desconocido"}.`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setProblema(
        `Pesa ${formatSize(file.size)} y el máximo son 5 MB. Redúcelo antes de subirlo.`,
      );
      return;
    }

    setProblema(null);
  }

  return (
    <form action={action} className="space-y-4">
      {problema ? null : <FormMessage state={state} />}

      <div>
        <label className={label} htmlFor="file">
          Archivo
        </label>
        <input
          className={input}
          id="file"
          name="file"
          type="file"
          accept={ACCEPTED.join(",")}
          required
          onChange={(event) => revisar(event.target.files?.[0])}
        />
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          Imágenes o PDF, hasta 5 MB.
        </p>
        {problema ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{problema}</p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Subiendo…" disabled={problema !== null}>
        Subir
      </SubmitButton>
    </form>
  );
}
