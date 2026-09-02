import { notFound } from "next/navigation";

import { createEntryAction } from "@/app/admin/actions";
import { EntryForm } from "@/components/entry-form";
import { requireUser } from "@/lib/auth/guards";
import { getContentTypeByApiId } from "@/lib/content-types";
import { AppError } from "@/lib/errors";

export const instant = false;

export default async function NewEntryPage({
  params,
}: PageProps<"/admin/content/[type]/new">) {
  await requireUser();
  const { type: apiId } = await params;

  const type = await getContentTypeByApiId(apiId).catch((error) => {
    if (error instanceof AppError && error.code === "not_found") notFound();
    throw error;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Nueva entrada · {type.name}</h1>
      <EntryForm
        action={createEntryAction.bind(null, apiId)}
        fields={type.fields}
        submitLabel="Crear"
      />
    </div>
  );
}
