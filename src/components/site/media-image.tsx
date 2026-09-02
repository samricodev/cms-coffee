import Image from "next/image";

export function MediaImage({
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

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={`/api/media/${id}`}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
