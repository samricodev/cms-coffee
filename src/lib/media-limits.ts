export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function mediaExtension(type: string): string | undefined {
  return Object.hasOwn(MEDIA_TYPES, type) ? MEDIA_TYPES[type] : undefined;
}

export function mediaProblem(file: { type: string; size: number }): string | null {
  if (!mediaExtension(file.type)) {
    return `Tipo no permitido: ${file.type || "desconocido"}.`;
  }

  if (file.size > MAX_MEDIA_BYTES) {
    return `Pesa ${formatSize(file.size)} y el máximo son 5 MB. Redúcelo antes de subirlo.`;
  }

  return null;
}
