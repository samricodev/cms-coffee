import { deleteMediaAction } from "@/app/admin/actions";
import { ConfirmDelete } from "@/components/confirm-delete";
import { MediaAltForm } from "@/components/media-alt-form";
import { MediaForm } from "@/components/media-form";
import { card } from "@/components/ui";
import { requireUser } from "@/lib/auth/guards";
import { listMedia } from "@/lib/media";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const instant = false;

export default async function MediaPage() {
  const actor = await requireUser();
  const items = await listMedia();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Medios</h1>

      <section className={`${card} space-y-4`}>
        <h2 className="font-medium">Subir archivo</h2>
        <MediaForm />
      </section>

      {items.length === 0 ? (
        <p className={`${card} text-sm text-muted`}>
          Todavía no hay archivos.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const url = `/api/media/${item.id}`;
            const mine = actor.role === "admin" || item.uploadedBy === actor.id;

            return (
              <li key={item.id} className={`${card} space-y-2`}>
                {item.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={item.alt ?? item.filename}
                    className="h-32 w-full rounded object-contain"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded bg-surface text-xs">
                    {item.mimeType}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {item.filename}
                  </p>
                  {item.mimeType.startsWith("image/") && !item.alt ? (
                    <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
                      falta descripción
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted">
                  {formatSize(item.size)} ·{" "}
                  <code className="select-all">{url}</code>
                </p>

                {item.mimeType.startsWith("image/") ? (
                  <MediaAltForm id={item.id} alt={item.alt} />
                ) : null}

                {mine ? (
                  <ConfirmDelete
                    action={deleteMediaAction.bind(null, item.id)}
                    label="Borrar"
                    compacto
                    aviso={`«${item.filename}» se borrará del disco definitivamente. Si alguna entrada lo usa, el borrado se rechazará.`}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
