"use client";

import MarkdownIt from "markdown-it";
import { useMemo, useState } from "react";

import { input, secondary } from "@/components/ui";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export function RichTextInput({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  const html = useMemo(() => (preview ? md.render(value) : ""), [preview, value]);

  return (
    <div className="space-y-2">
      <textarea
        className={`${input} min-h-60 font-mono ${preview ? "hidden" : ""}`}
        id={id}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      {preview ? (
        <div
          className="prose-preview min-h-60 rounded-md border border-black/15 px-3 py-2 dark:border-white/20"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={secondary}
          onClick={() => setPreview((current) => !current)}
        >
          {preview ? "Editar" : "Vista previa"}
        </button>
        <span className="text-xs text-black/60 dark:text-white/60">
          Markdown: <code>## título</code>, <code>**negrita**</code>,{" "}
          <code>[enlace](url)</code>. El HTML se escapa.
        </span>
      </div>
    </div>
  );
}
