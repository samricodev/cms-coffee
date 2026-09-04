#!/usr/bin/env bash
# Copia de seguridad de la base de datos y de los archivos subidos.
set -euo pipefail

cd "$(dirname "$0")/.."

DESTINO="${BACKUP_DIR:-backups}"
RETENER="${BACKUP_KEEP:-14}"
SERVICIO="${DB_SERVICE:-db}"
USUARIO="${POSTGRES_USER:-cms}"
BASE="${POSTGRES_DB:-cms}"

MARCA="$(date +%Y%m%d-%H%M%S)"
CARPETA="$DESTINO/$MARCA"

mkdir -p "$CARPETA"

echo "→ Volcando la base «$BASE»…"
# Formato personalizado (-Fc): comprimido y restaurable con pg_restore, que
# permite restaurar tablas sueltas. Un .sql plano solo se puede reproducir entero.
docker compose exec -T "$SERVICIO" pg_dump -U "$USUARIO" -d "$BASE" -Fc \
  > "$CARPETA/base.dump"

echo "→ Empaquetando los archivos subidos…"
if [ -d storage/media ] && [ -n "$(ls -A storage/media 2>/dev/null)" ]; then
  tar -czf "$CARPETA/media.tar.gz" -C storage media
else
  echo "  (no hay archivos todavía)"
  tar -czf "$CARPETA/media.tar.gz" -C storage --files-from /dev/null
fi

{
  echo "fecha=$MARCA"
  echo "base=$BASE"
  echo "migraciones=$(ls drizzle/*.sql | wc -l | tr -d ' ')"
  echo "commit=$(git rev-parse --short HEAD 2>/dev/null || echo desconocido)"
} > "$CARPETA/info.txt"

echo "→ Reteniendo las $RETENER copias más recientes…"
ls -1d "$DESTINO"/*/ 2>/dev/null \
  | sort -r \
  | tail -n +"$((RETENER + 1))" \
  | xargs -r rm -rf

TAMANO="$(du -sh "$CARPETA" | cut -f1)"
echo "✓ Copia en $CARPETA ($TAMANO)"
