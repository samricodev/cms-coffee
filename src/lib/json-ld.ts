/**
 * `JSON.stringify` deja `<` tal cual, y dentro de un `<script>` el navegador
 * cierra la etiqueta en cuanto lee `</script>`, aunque esté dentro de una
 * cadena JSON. Escapar `<`, `>` y `&` como `<`… da el mismo JSON.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
