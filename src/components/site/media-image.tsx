import Image from "next/image";

import { getMediaAlt } from "@/lib/public-content";

export async function MediaImage({
  id,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: {
  id: unknown;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (typeof id !== "string" || id === "") return null;

  const descripcion = (await getMediaAlt(id)) ?? alt;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={`/api/media/${id}`}
        alt={descripcion}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
