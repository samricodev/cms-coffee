"use client";

import { useActionState } from "react";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { danger, input, label } from "@/components/ui";
import { idleForm, type FormState } from "@/lib/form";

/**
 * El paso de confirmación es un `<details>`: sin JavaScript se despliega igual
 * y el formulario de dentro sigue enviándose. Cuando pedimos escribir un texto,
 * quien lo comprueba de verdad es el servidor, no este componente.
 */
export function ConfirmDelete({
  action,
  label: etiqueta,
  aviso,
  confirmar,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  label: string;
  aviso: string;
  confirmar?: { campo: string; valor: string };
}) {
  const [state, formAction] = useActionState(action, idleForm);

  return (
    <details className="rounded-md border border-red-500/30 p-3">
      <summary className="cursor-pointer text-sm font-medium text-red-600 dark:text-red-400">
        {etiqueta}
      </summary>

      <div className="mt-3 space-y-3">
        <FormMessage state={state} />

        <p className="max-w-prose text-sm text-black/70 dark:text-white/70">
          {aviso}
        </p>

        <form action={formAction} className="space-y-3">
          {confirmar ? (
            <div className="max-w-xs">
              <label className={label} htmlFor={`confirmar-${confirmar.valor}`}>
                Escribe <code className="font-mono">{confirmar.valor}</code> para
                confirmar
              </label>
              <input
                className={input}
                id={`confirmar-${confirmar.valor}`}
                name={confirmar.campo}
                autoComplete="off"
                required
              />
            </div>
          ) : null}

          <SubmitButton className={danger} pendingLabel="Borrando…">
            Sí, {etiqueta.toLowerCase()}
          </SubmitButton>
        </form>
      </div>
    </details>
  );
}
