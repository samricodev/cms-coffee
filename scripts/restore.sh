#!/usr/bin/env bash
# Restaura una copia de seguridad. DESTRUCTIVO: reemplaza la base de destino.
set -euo pipefail

cd "$(dirname "$0")/.."

CARPETA="${1:-}"
DESTINO_BASE="${2:-}"
SERVICIO="${DB_SERVICE:-db}"
USUARIO="${POSTGRES_USER:-cms}"

if [ -z "$CARPETA" ] || [ -z "$DESTINO_BASE" ]; then
  echo "Uso: scripts/restore.sh <carpeta-de-copia> <base-destino>"
  echo
  echo "Copias disponibles:"
  ls -1d backups/*/ 2>/dev/null || echo "  (ninguna)"
  exit 1
fi

if [ ! -f "$CARPETA/base.dump" ]; then
  echo "✗ No encuentro $CARPETA/base.dump"
  exit 1
fi

# Una restauración borra datos: exigir que se escriba el nombre evita el
# accidente de restaurar sobre producción creyendo que era una prueba.
if [ "${CONFIRMAR:-}" != "$DESTINO_BASE" ]; then
  echo "✗ Esto REEMPLAZA el contenido de «$DESTINO_BASE»."
  echo "  Para confirmarlo: CONFIRMAR=$DESTINO_BASE scripts/restore.sh $CARPETA $DESTINO_BASE"
  exit 1
fi

echo "→ Asegurando que existe «$DESTINO_BASE»…"
docker compose exec -T "$SERVICIO" psql -U "$USUARIO" -d postgres -tAc \
  "select 1 from pg_database where datname = '$DESTINO_BASE'" | grep -q 1 \
  || docker compose exec -T "$SERVICIO" psql -U "$USUARIO" -d postgres \
       -c "CREATE DATABASE \"$DESTINO_BASE\""

echo "→ Restaurando la base…"
docker compose exec -T "$SERVICIO" pg_restore -U "$USUARIO" -d "$DESTINO_BASE" \
  --clean --if-exists --no-owner < "$CARPETA/base.dump"

# Los archivos solo se restauran sobre la base principal. Restaurar en una base
# de prueba no debe pisar los medios reales, que son compartidos.
PRINCIPAL="${POSTGRES_DB:-cms}"

if [ "$DESTINO_BASE" = "$PRINCIPAL" ] && [ -f "$CARPETA/media.tar.gz" ]; then
  echo "→ Restaurando los archivos subidos…"
  mkdir -p storage
  tar -xzf "$CARPETA/media.tar.gz" -C storage
else
  echo "→ Archivos subidos: omitidos (destino distinto de «$PRINCIPAL»)"
fi

echo "✓ Restaurado en «$DESTINO_BASE»"
