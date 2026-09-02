import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { deleteEntryAction, updateEntryAction } from "@/app/admin/actions";
import { EntryForm } from "@/components/entry-form";
import { SubmitButton } from "@/components/submit-button";
import { card, danger, secondary } from "@/components/ui";
import { assertCanModify, requireUser } from "@/lib/auth/guards";
import { getContentTypeByApiId } from "@/lib/content-types";
import { getEntry } from "@/lib/entries";
import { AppError } from "@/lib/errors";

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
        submitLabel="Guardar cambios"
      />

      <form action={deleteEntryAction.bind(null, apiId, entry.id)}>
        <SubmitButton className={danger} pendingLabel="Borrando…">
          Borrar entrada
        </SubmitButton>
      </form>
    </div>
  );
}
