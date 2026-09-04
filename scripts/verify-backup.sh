#!/usr/bin/env bash
# Simulacro de restauración: una copia que nunca se ha restaurado no es una copia.
set -euo pipefail

cd "$(dirname "$0")/.."

CARPETA="${1:-$(ls -1d backups/*/ 2>/dev/null | sort -r | head -1)}"
SERVICIO="${DB_SERVICE:-db}"
USUARIO="${POSTGRES_USER:-cms}"
ORIGEN="${POSTGRES_DB:-cms}"
PRUEBA="cms_verificacion"

if [ -z "${CARPETA:-}" ] || [ ! -f "$CARPETA/base.dump" ]; then
  echo "✗ No hay ninguna copia que verificar."
  exit 1
fi

CARPETA="${CARPETA%/}"
echo "→ Verificando $CARPETA"

sql() {
  docker compose exec -T "$SERVICIO" psql -U "$USUARIO" -d "$1" -tAc "$2" | tr -d ' \r'
}

limpiar() {
  docker compose exec -T "$SERVICIO" psql -U "$USUARIO" -d postgres \
    -c "DROP DATABASE IF EXISTS \"$PRUEBA\" WITH (FORCE)" > /dev/null 2>&1 || true
}
trap limpiar EXIT

limpiar
docker compose exec -T "$SERVICIO" psql -U "$USUARIO" -d postgres \
  -c "CREATE DATABASE \"$PRUEBA\"" > /dev/null

docker compose exec -T "$SERVICIO" pg_restore -U "$USUARIO" -d "$PRUEBA" \
  --no-owner < "$CARPETA/base.dump" > /dev/null

FALLOS=0

TABLAS="users sessions content_types content_fields entries media"
for tabla in $TABLAS; do
  if [ "$(sql "$PRUEBA" "select to_regclass('public.$tabla') is not null")" != "t" ]; then
    echo "  ✗ falta la tabla $tabla"
    FALLOS=$((FALLOS + 1))
  fi
done

ESPERADAS="$(ls drizzle/*.sql | wc -l | tr -d ' ')"
APLICADAS="$(sql "$PRUEBA" 'select count(*) from drizzle.__drizzle_migrations')"
if [ "$APLICADAS" != "$ESPERADAS" ]; then
  echo "  ✗ migraciones: $APLICADAS en la copia, $ESPERADAS en el repositorio"
  FALLOS=$((FALLOS + 1))
fi

echo
printf "  %-16s %10s %10s\n" "tabla" "copia" "actual"
for tabla in $TABLAS; do
  printf "  %-16s %10s %10s\n" "$tabla" \
    "$(sql "$PRUEBA" "select count(*) from \"$tabla\"")" \
    "$(sql "$ORIGEN" "select count(*) from \"$tabla\"")"
done
echo

ARCHIVOS="$(tar -tzf "$CARPETA/media.tar.gz" 2>/dev/null | grep -c '\.[a-z]*$' || true)"
REGISTRADOS="$(sql "$PRUEBA" 'select count(*) from media')"
echo "  archivos en el paquete: $ARCHIVOS · filas en media: $REGISTRADOS"
if [ "$ARCHIVOS" != "$REGISTRADOS" ]; then
  echo "  ✗ el número de archivos no cuadra con las filas de media"
  FALLOS=$((FALLOS + 1))
fi

echo
if [ "$FALLOS" -eq 0 ]; then
  echo "✓ La copia se restaura y está completa."
else
  echo "✗ $FALLOS problema(s) en la copia."
  exit 1
fi
