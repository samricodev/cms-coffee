import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { deleteEntryAction, updateEntryAction } from "@/app/admin/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { EntryForm } from "@/components/entry-form";
import { card, secondary } from "@/components/ui";
import { assertCanModify, requireUser } from "@/lib/auth/guards";
import { getContentTypeByApiId } from "@/lib/content-types";
import { getEntry, listReferencing } from "@/lib/entries";
import { listRelationOptions } from "@/lib/relations";
import { AppError } from "@/lib/errors";

export const instant = false;

export default async function EditEntryPage({
  params,
}: PageProps<"/admin/content/[type]/[id]">) {
  const user = await requireUser();
  const { type: apiId, id } = await params;

  if (!z.uuid().safeParse(id).success) notFound();

  const type = await getContentTypeByApiId(apiId).catch((error) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });

  const entry = await getEntry(type, id).catch((error) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });

  const referencing = await listReferencing(entry.id);

  let canModify = true;
  try {
    assertCanModify(user, entry);
  } catch {
    canModify = false;
  }

  if (!canModify) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{entry.title}</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Esta entrada es de otro autor, así que solo puedes leerla.
        </p>
        <pre className={`${card} overflow-x-auto text-xs`}>
          {JSON.stringify(entry.data, null, 2)}
        </pre>
        <Link href={`/admin/content/${apiId}`} className={secondary}>
          Volver
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Editar · {type.name}</h1>
        <Link href={`/admin/content/${apiId}`} className={`${secondary} ml-auto`}>
          Volver
        </Link>
      </div>

      <EntryForm
        action={updateEntryAction.bind(null, apiId, entry.id)}
        fields={type.fields}
        entry={entry}
        relationOptions={await listRelationOptions(type)}
        submitLabel="Guardar cambios"
      />

      {referencing.length > 0 ? (
        <section className={`${card} space-y-2`}>
          <h2 className="text-sm font-medium">Referenciada por</h2>
          <ul className="space-y-1 text-sm">
            {referencing.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/admin/content/${item.typeApiId}/${item.id}`}
                  className="hover:underline"
                >
                  {item.title}
                </Link>
                <span className="ml-2 text-xs text-black/50 dark:text-white/50">
                  {item.typeName}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-black/60 dark:text-white/60">
            Mientras existan estas referencias, la entrada no se puede borrar.
          </p>
        </section>
      ) : null}

      <ConfirmDelete
        action={deleteEntryAction.bind(null, apiId, entry.id)}
        label="Borrar entrada"
        aviso={`«${entry.title}» se borrará definitivamente. Si otras entradas la referencian, el borrado se rechazará.`}
      />
    </div>
  );
}
