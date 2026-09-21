import { NextResponse, type NextRequest } from "next/server";

import { esEscrituraDeOtroOrigen } from "@/lib/csrf";

export function proxy(request: NextRequest) {
  const bloquear = esEscrituraDeOtroOrigen({
    method: request.method,
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
  });

  if (bloquear) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Petición rechazada: no viene de este sitio" } },
      { status: 403 },
    );
  }
}

export const config = {
  matcher: "/api/:path*",
};
