"use client";

import { useRef, useState } from "react";

import { secondary } from "@/components/ui";

type MediaItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
};

export function MediaPicker({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [broken, setBroken] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  async function open() {
    dialog.current?.showModal();

    if (items === null) {
      const response = await fetch("/api/media");
      const payload = await response.json();
      setItems(response.ok ? (payload.items ?? []) : []);
    }
  }

  function choose(item: MediaItem) {
    setValue(item.id);
    setBroken(false);
    dialog.current?.close();
  }

  return (
    <div className="space-y-2">
      <input type="hidden" id={id} name={name} value={value} readOnly />

      <div className="flex items-center gap-3">
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${value}`}
            alt=""
            onError={() => setBroken(true)}
            className="h-16 w-16 rounded border border-black/10 object-cover dark:border-white/15"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-black/15 text-[10px] text-black/50 dark:border-white/20 dark:text-white/50">
            {value ? "archivo" : "vacío"}
          </div>
        )}

        <button type="button" className={secondary} onClick={open}>
          {value ? "Cambiar" : "Elegir archivo"}
        </button>

        {value ? (
          <button
            type="button"
            className="text-sm text-red-600 hover:underline dark:text-red-400"
            onClick={() => setValue("")}
          >
            Quitar
          </button>
        ) : null}
      </div>

      <dialog
        ref={dialog}
        className="m-auto w-[min(42rem,92vw)] rounded-lg border border-black/10 bg-background p-5 text-foreground backdrop:bg-black/60 dark:border-white/15"
      >
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-medium">Biblioteca</h2>
          <button
            type="button"
            className={`${secondary} ml-auto`}
            onClick={() => dialog.current?.close()}
          >
            Cerrar
          </button>
        </div>

        {items === null ? (
          <p className="text-sm text-black/60 dark:text-white/60">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            No hay archivos todavía. Súbelos desde Medios.
          </p>
        ) : (
          <ul className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => choose(item)}
                  className="w-full rounded border border-black/10 p-2 text-left hover:border-black/40 dark:border-white/15 dark:hover:border-white/50"
                >
                  {item.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="h-20 w-full rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded bg-black/5 text-[10px] dark:bg-white/10">
                      {item.mimeType}
                    </div>
                  )}
                  <span className="mt-1 block truncate text-xs">
                    {item.filename}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </dialog>
    </div>
  );
}
