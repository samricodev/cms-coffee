import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { deleteContentTypeAction, deleteFieldAction } from "@/app/admin/actions";
import { FieldForm } from "@/components/field-form";
import { Forbidden } from "@/components/forbidden";
import { SubmitButton } from "@/components/submit-button";
import { card, danger, secondary } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { getContentTypeById } from "@/lib/content-types";
import { AppError } from "@/lib/errors";

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Texto",
  textarea: "Texto largo",
  number: "Número",
  boolean: "Sí / No",
  date: "Fecha",
  select: "Selección",
};

export const instant = false;

export default async function ContentTypePage({
  params,
}: PageProps<"/admin/types/[id]">) {
  const actor = await requireUser();
  const { id } = await params;

  if (actor.role !== "admin") {
    return <Forbidden message="Modelar tipos de contenido es solo para administradores." />;
  }

  if (!z.uuid().safeParse(id).success) notFound();

  const type = await getContentTypeById(id).catch((error) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{type.name}</h1>
        <code className="text-xs text-black/60 dark:text-white/60">
          /api/content/{type.apiId}
        </code>
        <Link href={`/admin/content/${type.apiId}`} className={`${secondary} ml-auto`}>
          Ver contenido
        </Link>
      </div>

      {type.fields.length === 0 ? (
        <p className={`${card} text-sm text-black/60 dark:text-white/60`}>
          Este tipo aún no tiene campos: sus entradas solo tendrán título y slug.
        </p>
      ) : (
        <ul className="space-y-2">
          {type.fields.map((field) => (
            <li key={field.id} className={`${card} flex flex-wrap items-center gap-2`}>
              <span className="font-medium">{field.label}</span>
              <code className="text-xs text-black/60 dark:text-white/60">
                {field.apiKey}
              </code>
              <span className="rounded bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
                {FIELD_TYPE_LABEL[field.type]}
              </span>
              {field.required ? (
                <span className="text-xs text-black/60 dark:text-white/60">
                  obligatorio
                </span>
              ) : null}
              {field.choices?.length ? (
                <span className="text-xs text-black/60 dark:text-white/60">
                  {field.choices.join(" · ")}
                </span>
              ) : null}
              <form
                action={deleteFieldAction.bind(null, type.id, field.id)}
                className="ml-auto"
              >
                <SubmitButton
                  className="text-xs text-red-600 hover:underline dark:text-red-400"
                  pendingLabel="…"
                >
                  Quitar
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}

      <section className={`${card} space-y-4`}>
        <h2 className="font-medium">Añadir campo</h2>
        <FieldForm contentTypeId={type.id} />
      </section>

      <form action={deleteContentTypeAction.bind(null, type.id)}>
        <SubmitButton className={danger} pendingLabel="Borrando…">
          Borrar tipo y su contenido
        </SubmitButton>
      </form>
    </div>
  );
}
