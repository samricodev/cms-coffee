import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import {
  deleteContentTypeAction,
  deleteFieldAction,
  moveFieldAction,
} from "@/app/admin/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { FieldForm } from "@/components/field-form";
import { Forbidden } from "@/components/forbidden";
import { SubmitButton } from "@/components/submit-button";
import { card, secondary } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import {
  contarEntradasConValor,
  getContentTypeById,
  listContentTypes,
} from "@/lib/content-types";
import { AppError } from "@/lib/errors";

function avisoValores(total: number): string {
  if (total === 0) return "Ninguna entrada tiene valor en este campo.";

  return total === 1
    ? "1 entrada tiene un valor guardado aquí: dejará de verse y de poder editarse."
    : `${total} entradas tienen un valor guardado aquí: dejará de verse y de poder editarse.`;
}

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Texto",
  textarea: "Texto largo",
  richtext: "Markdown",
  number: "Número",
  boolean: "Sí / No",
  date: "Fecha",
  select: "Selección",
  tags: "Etiquetas",
  media: "Archivo",
  relation: "Relación",
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

  const conValor = Object.fromEntries(
    await Promise.all(
      type.fields.map(
        async (field) =>
          [field.id, await contarEntradasConValor(type.id, field.apiKey)] as const,
      ),
    ),
  );

  const targets = (await listContentTypes()).map((option) => ({
    id: option.id,
    name: option.name,
  }));

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
          {type.fields.map((field, index) => (
            <li key={field.id} className={`${card} space-y-2`}>
              <div className="flex flex-wrap items-center gap-2">
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
              {field.type === "relation" ? (
                <span className="text-xs text-black/60 dark:text-white/60">
                  → {targets.find((target) => target.id === field.targetTypeId)?.name ?? "?"}
                  {field.multiple ? " (varias)" : ""}
                </span>
              ) : null}
              {field.choices?.length ? (
                <span className="text-xs text-black/60 dark:text-white/60">
                  {field.choices.join(" · ")}
                </span>
              ) : null}
              <div className="ml-auto flex items-center gap-2">
                {index > 0 ? (
                  <form action={moveFieldAction.bind(null, type.id, field.id, "up")}>
                    <SubmitButton
                      className="text-xs text-black/60 hover:underline dark:text-white/60"
                      pendingLabel="…"
                    >
                      Subir
                    </SubmitButton>
                  </form>
                ) : null}
                {index < type.fields.length - 1 ? (
                  <form action={moveFieldAction.bind(null, type.id, field.id, "down")}>
                    <SubmitButton
                      className="text-xs text-black/60 hover:underline dark:text-white/60"
                      pendingLabel="…"
                    >
                      Bajar
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
              </div>

              <ConfirmDelete
                action={deleteFieldAction.bind(null, type.id, field.id)}
                label="Quitar campo"
                compacto
                aviso={`Se quitará «${field.label}» del tipo. ${avisoValores(conValor[field.id])}`}
              />
            </li>
          ))}
        </ul>
      )}

      <section className={`${card} space-y-4`}>
        <h2 className="font-medium">Añadir campo</h2>
        <FieldForm contentTypeId={type.id} targets={targets} />
      </section>

      <ConfirmDelete
        action={deleteContentTypeAction.bind(null, type.id)}
        label="Borrar tipo y su contenido"
        aviso={`Se borrarán el tipo «${type.name}», sus ${type.fields.length} campos y todas sus entradas. No hay vuelta atrás.`}
        confirmar={{ campo: "confirmacion", valor: type.apiId }}
      />
    </div>
  );
}
