import { renderMarkdown } from "@/lib/markdown";

export function Prose({
  markdown,
  className = "",
}: {
  markdown: unknown;
  className?: string;
}) {
  if (typeof markdown !== "string" || markdown.trim() === "") return null;

  return (
    <div
      className={`prose-preview ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }}
    />
  );
}
