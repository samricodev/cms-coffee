const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

type Peticion = {
  method: string;
  origin: string | null;
  host: string | null;
  forwardedHost: string | null;
};

/**
 * Los navegadores siempre envían `Origin` en un POST, PATCH o DELETE, y una web
 * ajena no puede falsificarlo. Si no coincide con nuestro host, la petición
 * viene de otro sitio aunque lleve nuestra cookie. Sin `Origin` no es un
 * navegador (curl, un script) y tampoco lleva la cookie de nadie por sorpresa.
 */
export function esEscrituraDeOtroOrigen({ method, origin, host, forwardedHost }: Peticion): boolean {
  if (METODOS_SEGUROS.has(method.toUpperCase())) return false;
  if (origin === null) return false;

  const nuestro = forwardedHost?.split(",")[0]?.trim() || host;
  if (!nuestro) return true;

  try {
    return new URL(origin).host !== nuestro;
  } catch {
    // `Origin: null` llega desde iframes con sandbox o archivos locales.
    return true;
  }
}
