export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;

export const MEDIA_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
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

/**
 * Cabeceras para servir un archivo desde nuestro propio dominio. Solo se
 * muestra en el navegador lo que está en `MEDIA_TYPES`; cualquier otra cosa
 * (un SVG antiguo, un tipo que dejó de admitirse) se descarga, porque un SVG
 * o un HTML abiertos aquí ejecutarían sus scripts con la sesión de quien mire.
 */
export function mediaResponseHeaders(item: {
  mimeType: string;
  size: number;
  filename: string;
}): Record<string, string> {
  const seguro = mediaExtension(item.mimeType) !== undefined;

  return {
    "Content-Type": seguro ? item.mimeType : "application/octet-stream",
    "Content-Length": String(item.size),
    "Content-Disposition": `${seguro ? "inline" : "attachment"}; filename="${encodeURIComponent(item.filename)}"`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=31536000, immutable",
  };
}
