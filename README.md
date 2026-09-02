# CMS de la cafetería

Gestor de contenido construido desde cero, que ahora sirve de base al sitio
público de una cafetería: páginas, artículos, los cafés que se sirven y los
eventos.

El contenido se modela **desde el panel**, sin escribir código: los tipos y sus
campos son datos, no tablas.

> **Alcance.** Este repo gestiona *contenido*. El inventario, las recetas y el
> punto de venta son un proyecto aparte y aparcado — ver
> [docs/alcance.md](docs/alcance.md) y [docs/inventario.md](docs/inventario.md).

## Stack

| Pieza | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Server Components y Route Handlers: backend y panel en un solo proyecto |
| Lenguaje | TypeScript | Tipos derivados del esquema de la base de datos |
| Base de datos | PostgreSQL 17 (Docker) | Relacional, con enums y restricciones reales |
| ORM | Drizzle | SQL explícito y migraciones versionadas en el repo |
| Estilos | Tailwind CSS 4 | |

## Puesta en marcha

```bash
cp .env.example .env.local   # solo la primera vez
npm install
npm run db:up                # levanta Postgres en Docker (puerto 5433)
npm run db:migrate           # aplica las migraciones
npm run db:seed              # datos de ejemplo + cuentas admin@cms.local y editor@cms.local
npm run dev                  # http://localhost:3000
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run db:up` / `db:down` | Arranca / para el contenedor de Postgres |
| `npm run db:generate` | Genera una migración SQL a partir de `src/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:seed` | Inserta datos de ejemplo (idempotente) |
| `npm run db:studio` | Explorador visual de la base de datos |

## Estructura

```
src/
  app/
    admin/            Panel (todas las páginas con `instant = false`)
      actions.ts      Server Actions: mutaciones desde formularios
      content/[type]/ Entradas de un tipo dinámico
      types/          Modelado de tipos y campos
      media/ users/   Biblioteca de archivos y cuentas
    login/            Formulario de acceso
    api/auth/         login, logout, me
    api/content/      API de gestión (requiere sesión)
    api/content-types/  Tipos y sus campos
    api/public/       API pública: solo contenido publicado
    api/media/[id]/   Servicio de archivos
    api/users/        Cuentas (solo admin)
    page.tsx          Sitio público de prueba (estático, cacheado)
  db/
    schema.ts         Definición de tablas: la fuente de verdad del modelo
    index.ts          Cliente de Drizzle + pool de conexiones
    seed.ts           Datos de ejemplo (idempotente)
  lib/
    content-types.ts  Dominio: tipos y campos
    entries.ts        Dominio: entradas + invalidación de caché
    public-content.ts Consultas cacheadas del contenido publicado
    media.ts          Subida, lectura y borrado de archivos
    users.ts          Alta de usuarios y verificación de credenciales
    http.ts           Traducción de errores del dominio a códigos HTTP
    errors.ts         Errores del dominio (sin dependencia de HTTP)
    form.ts           Estado de formulario para Server Actions
    slug.ts           Generación de slugs
    auth/
      password.ts     Hash y verificación con argon2id
      session.ts      Sesiones en base de datos + cookie
      guards.ts       requireUser / requireAdmin / propiedad del contenido
    validation/       Esquemas Zod (incluido el dinámico por tipo)
  components/         Formularios de cliente y piezas de UI
drizzle/              Migraciones SQL, incluidas las de datos
storage/media/        Archivos subidos (fuera de git)
```

La regla de oro: **las rutas no contienen lógica de negocio**. Un Route Handler
valida la entrada, llama a `src/lib/*` y traduce el resultado a HTTP. El panel
usa esas mismas funciones desde Server Actions, sin pasar por la red.

## Modelo de datos

Todo el contenido vive en **un solo sistema**, definido por datos:

- **users** — `id`, `email` (único), `name`, `password_hash`, `role`
  (`admin` | `editor`)
- **sessions** — `token_hash` (único), `user_id`, `expires_at`
- **content_types** — un tipo (Artículo, Producto…) con su `api_id` único
- **content_fields** — los campos de cada tipo (`label`, `api_key`, `type`,
  `required`, `choices`)
- **entries** — las entradas: `title`, `slug`, `status`, `published_at`,
  `author_id`, `seo_description`, `seo_image_id` y los valores de los campos en
  una columna `data jsonb`. El slug es único **por tipo**
- **media** — archivos subidos (`filename`, `mime_type`, `size`, `storage_key`)

No hay tablas por tipo de contenido: crear "Producto" no genera una migración,
inserta filas en `content_types` y `content_fields`.

## Sitio público

| Ruta | Qué muestra |
|---|---|
| `/` | Artículo destacado, café del mes, cafés, carta y próximas catas |
| `/carta` | La carta agrupada por categoría |
| `/cafes` · `/cafes/:slug` | Los orígenes y su ficha completa, con dónde aparecen |
| `/articulos` · `/articulos/:slug` | El diario, con el Markdown renderizado |
| `/eventos` | Agenda, separando próximos de pasados |
| `/buscar` | Búsqueda de texto completo sobre todo el contenido publicado |
| `/:slug` | Páginas sueltas (`/quienes-somos`, `/como-llegar`) |

`/cafes` acepta filtros combinables por query string: `?pais=`, `?proceso=`,
`?tueste=` y `?nota=`. También se publican `/sitemap.xml`, `/robots.txt` y
`/feed.xml` (RSS del diario), y las fichas llevan datos estructurados JSON-LD.

Las páginas leen de `src/lib/public-content.ts`, que está cacheado, así que se
prerenderizan y se revalidan solas. El nombre del sitio y el menú se cambian en
`src/lib/site.ts`.

## Panel

| Ruta | Qué es |
|---|---|
| `/login` | Acceso; redirige a `/admin` si ya hay sesión |
| `/admin` | Resumen de tipos de contenido con sus contadores |
| `/admin/types` · `/admin/types/:id` | Modelar tipos de contenido y sus campos (solo `admin`) |
| `/admin/content/:tipo` | Entradas de un tipo dinámico |
| `/admin/content/:tipo/new` · `/:id` | Formulario generado a partir de los campos del tipo |
| `/admin/media` | Biblioteca de archivos |
| `/admin/users` | Cuentas (solo `admin`) |
| `/` | Vista pública de prueba: solo entradas publicadas |

El panel **no llama a la API**: las páginas leen de `src/lib/*` en el servidor y
los formularios mutan con Server Actions. La API REST existe para clientes
externos, que es la razón de ser de un CMS headless.

## API de gestión

Requiere sesión (cookie de `/api/auth/login`).

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/login` | Inicia sesión y deja la cookie |
| `POST` | `/api/auth/logout` | Cierra la sesión |
| `GET` | `/api/auth/me` | Usuario actual |
| `GET` | `/api/content-types` | Tipos definidos, con sus campos |
| `GET` | `/api/content/:tipo` | Entradas (paginación, `status`, `q`) |
| `POST` | `/api/content/:tipo` | Crea una entrada (`{title, slug?, status?, publishedAt?, data}`) |
| `GET` | `/api/content/:tipo/:id` | Una entrada |
| `PATCH` | `/api/content/:tipo/:id` | Actualiza; `data` se fusiona, no se reemplaza |
| — | `?expand=clave` o `?expand=*` | Resuelve las relaciones en `expanded` (listado y detalle) |
| `DELETE` | `/api/content/:tipo/:id` | Borra |
| `GET` `POST` | `/api/users` | Cuentas (solo `admin`) |

Códigos de error:

| Código | Cuándo |
|---|---|
| `400` | El cuerpo no es JSON válido, o el id no es un UUID |
| `401` | No hay sesión |
| `403` | Hay sesión pero no permiso (rol o propiedad del contenido) |
| `404` | El recurso no existe |
| `409` | Conflicto: el slug ya está en uso dentro de ese tipo |
| `422` | Datos inválidos (incluye `issues[]` por campo) |

## Tipos de contenido dinámicos

El contenido se define **desde el panel**, sin escribir código ni generar
migraciones. El esquema de validación se **construye en tiempo de ejecución** a partir de las
definiciones de campo, así que la API y el formulario del panel salen los dos de
la misma fuente.

```bash
curl -b cookies.txt -X POST http://localhost:3000/api/content/producto \
  -H 'content-type: application/json' \
  -d '{"title":"Camiseta","data":{"precio":19.9,"categoria":"camisetas"}}'
```

El slug es único **por tipo**: un producto y un evento pueden compartirlo.

## API pública

Sin autenticación y **solo contenido publicado**. Es la API que consumiría un
sitio web, una app móvil o cualquier cliente externo.

| Método | Ruta | Qué devuelve |
|---|---|---|
| `GET` | `/api/public/:tipo` | Entradas publicadas del tipo |
| `GET` | `/api/public/:tipo/:slug` | Una entrada publicada |
| `GET` | `/api/media/:id` | Un archivo subido |

```bash
curl http://localhost:3000/api/public/producto
```

Una entrada solo es pública si `status = published` **y** su `publishedAt` ya ha
pasado: una fecha futura la deja programada.

## Caché

El proyecto usa Cache Components (`cacheComponents: true` en `next.config.ts`):

- `src/lib/public-content.ts` marca sus consultas con `"use cache"`, les da una
  vida con `cacheLife("minutes")` y una etiqueta con `cacheTag`.
- La capa de dominio llama a `revalidateTag(tag, "max")` en cada escritura, así
  que publicar invalida la caché sin que ninguna ruta tenga que acordarse.
- Con el perfil `"max"`, la primera petición tras invalidar recibe contenido
  antiguo mientras se recalcula en segundo plano; la siguiente ya es fresca.
- Las páginas del panel llevan `export const instant = false`: dependen de la
  sesión, así que bloquean a propósito y no se prerenderizan.

## Medios

Se admiten imágenes y PDF de hasta 5 MB. Ese límite se sostiene en tres sitios y
los tres importan: el navegador avisa antes de enviar, `createMedia` lo valida
en el servidor, y `serverActions.bodySizeLimit` en `next.config.ts` está en
6 MB para dejar sitio a la sobrecarga del multipart — con el valor por defecto
de 1 MB, Next corta la petición antes de que llegue a validarse.

Los archivos se guardan en `storage/media/` (fuera de `public/`, ignorado por
git) y se sirven por `/api/media/:id` con `Cache-Control: immutable`: el
contenido de un id nunca cambia. Se admiten imágenes y PDF de hasta 5 MB.

## Búsqueda

`entries.search_vector` es una columna **generada** que Postgres mantiene sola:

```sql
setweight(to_tsvector('spanish', title), 'A') ||
setweight(jsonb_to_tsvector('spanish', data, '["string"]'), 'B')
```

Con índice GIN y consultas por `websearch_to_tsquery('spanish', …)`. Eso da
gratis lo que un `LIKE` nunca dará: raíces (`vertido` encuentra `vertidos`),
tildes indiferentes (`cafe` = `café`), frases entre comillas y ordenación por
relevancia, con el título pesando más que el cuerpo.

## Despliegue

Variables necesarias: `DATABASE_URL`, `SITE_URL` y `SEED_PASSWORD` (solo para
el seed). Antes de arrancar, `npm run db:migrate`. La carpeta `storage/media`
debe ser un volumen persistente: si el servidor es efímero, los archivos
subidos desaparecen y hay que moverlos a un almacenamiento externo.

## Roadmap

- [x] **Fase 1** — Andamiaje, Postgres en Docker, Drizzle, esquema inicial
- [x] **Fase 2** — API de contenido (CRUD) con validación (Zod)
- [x] **Fase 3** — Autenticación por sesión y roles
- [x] **Fase 4** — Panel de administración (Server Actions)
- [x] **Fase 5** — Tipos de contenido dinámicos
- [x] **Fase 6** — Publicación, media, API pública y caché
- [x] **Migración** — `posts` absorbido por el sistema dinámico (tipo `articulo`)

Siguiente, hacia el sitio de la cafetería (ver [docs/alcance.md](docs/alcance.md)):

- [x] **Fase 7** — Tipos de campo `media`, `tags` y `richtext`, y reordenar campos
- [x] **Fase 8** — Relaciones entre tipos, con expansión e integridad referencial
- [x] **Fase 9** — Modelado del sitio: Página, Café, Producto, Evento, y SEO por entrada
- [x] **Fase 10** — El sitio público: portada, carta, cafés, diario, eventos y páginas
- [x] **Fase 11** — Búsqueda, filtros y SEO
