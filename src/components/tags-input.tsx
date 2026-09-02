"use client";

import { useState } from "react";

import { input } from "@/components/ui";

export function TagsInput({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: string;
}) {
  const [raw, setRaw] = useState(defaultValue);

  const tags = [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];

  return (
    <div className="space-y-2">
      <input
        className={input}
        id={id}
        name={name}
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        placeholder="jazmín, melocotón, bergamota"
      />

      {tags.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs dark:bg-white/10"
            >
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
