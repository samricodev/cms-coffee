"use client";

import { useEffect, useRef, useState } from "react";

import { input, secondary } from "@/components/ui";
import { MEDIA_TYPES, mediaProblem } from "@/lib/media-limits";
import { MAX_ALT_LENGTH } from "@/lib/validation/media";

type MediaItem = {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  alt: string | null;
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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<MediaItem | null>(null);
  const [alt, setAlt] = useState("");
  const [altState, setAltState] = useState<"limpio" | "guardando" | "guardado">("limpio");
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function recordar(elegido: MediaItem) {
    setItem(elegido);
    setAlt(elegido.alt ?? "");
    setAltState("limpio");
  }

  useEffect(() => {
    if (!defaultValue) return;

    let vivo = true;

    fetch("/api/media")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!vivo || !payload) return;

        const lista: MediaItem[] = payload.items ?? [];
        setItems(lista);

        const actual = lista.find((file) => file.id === defaultValue);
        if (actual) recordar(actual);
      })
      .catch(() => {});

    return () => {
      vivo = false;
    };
  }, [defaultValue]);

  async function open() {
    dialog.current?.showModal();

    if (items === null) {
      const response = await fetch("/api/media");
      const payload = await response.json();
      const lista: MediaItem[] = response.ok ? (payload.items ?? []) : [];
      setItems(lista);

      const actual = lista.find((file) => file.id === value);
      if (actual) recordar(actual);
    }
  }

  function choose(elegido: MediaItem) {
    setValue(elegido.id);
    setBroken(false);
    setError(null);
    recordar(elegido);
    dialog.current?.close();
  }

  async function guardarAlt() {
    if (!item || alt.trim() === (item.alt ?? "")) return;

    setAltState("guardando");

    try {
      const response = await fetch(`/api/media/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error?.message ?? "No se pudo guardar la descripción.");
        setAltState("limpio");
        return;
      }

      const actualizado = { ...item, alt: payload.alt as string | null };
      setItem(actualizado);
      setItems((current) =>
        current?.map((file) => (file.id === actualizado.id ? actualizado : file)) ?? current,
      );
      setAltState("guardado");
    } catch {
      setError("No se pudo conectar con el servidor.");
      setAltState("limpio");
    }
  }

  async function upload(file: File | undefined) {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;

    const problem = mediaProblem(file);
    if (problem) {
      setError(problem);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/media", { method: "POST", body });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error?.message ?? "No se pudo subir el archivo.");
        return;
      }

      setItems((current) => (current ? [payload, ...current] : current));
      choose(payload);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setUploading(false);
    }
  }

  const uploadButton = (
    <button
      type="button"
      className={secondary}
      disabled={uploading}
      onClick={() => fileInput.current?.click()}
    >
      {uploading ? "Subiendo…" : "Subir nueva"}
    </button>
  );

  return (
    <div className="space-y-2">
      <input type="hidden" id={id} name={name} value={value} readOnly />
      <input
        ref={fileInput}
        type="file"
        accept={Object.keys(MEDIA_TYPES).join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => upload(event.target.files?.[0])}
      />

      <div className="flex flex-wrap items-center gap-3">
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/media/${value}`}
            alt=""
            onError={() => setBroken(true)}
            className="h-16 w-16 rounded border border-line object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded border border-dashed border-line text-[10px] text-muted">
            {value ? "archivo" : "vacío"}
          </div>
        )}

        <button type="button" className={secondary} onClick={open}>
          {value ? "Cambiar" : "Elegir de la biblioteca"}
        </button>

        {uploadButton}

        {value ? (
          <button
            type="button"
            className="text-sm text-red-600 hover:underline"
            onClick={() => {
              setValue("");
              setItem(null);
              setAlt("");
            }}
          >
            Quitar
          </button>
        ) : null}
      </div>

      {value && item ? (
        <div className="max-w-md space-y-1">
          <label className="block text-xs font-medium" htmlFor={`alt-${id}`}>
            Texto alternativo de la foto
          </label>
          <input
            className={`${input} text-sm`}
            id={`alt-${id}`}
            value={alt}
            maxLength={MAX_ALT_LENGTH}
            placeholder="Describe lo que se ve"
            onChange={(event) => {
              setAlt(event.target.value);
              setAltState("limpio");
            }}
            onBlur={guardarAlt}
          />
          <p className="text-xs text-muted">
            {altState === "guardando"
              ? "Guardando…"
              : altState === "guardado"
                ? "Guardado"
                : "Se guarda al salir del campo y vale para todas las entradas que usen esta foto."}
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}

      <dialog
        ref={dialog}
        className="m-auto w-[min(42rem,92vw)] rounded-lg border border-line bg-paper p-5 text-ink backdrop:bg-ink/60"
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-medium">Biblioteca</h2>
          <div className="ml-auto flex gap-2">
            {uploadButton}
            <button
              type="button"
              className={secondary}
              onClick={() => dialog.current?.close()}
            >
              Cerrar
            </button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="mb-3 text-xs text-red-600">
            {error}
          </p>
        ) : null}

        {items === null ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">
            No hay archivos todavía. Usa «Subir nueva» para añadir el primero.
          </p>
        ) : (
          <ul className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-4">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => choose(item)}
                  className="w-full rounded border border-line p-2 text-left hover:border-accent"
                >
                  {item.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="h-20 w-full rounded object-contain"
                    />
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded bg-surface text-[10px]">
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
