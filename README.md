# CMS headless — proyecto de aprendizaje

Un CMS headless construido desde cero para entender cómo funciona uno por
dentro. **Headless** significa que este proyecto gestiona el contenido y lo
expone por API; no renderiza el sitio público final (ese sería otro cliente).

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
    api/auth/       login, logout, me
    api/posts/      Route Handlers: la capa HTTP (delgada)
    api/users/      Gestión de cuentas (solo admin)
    page.tsx        Portada de prueba
  db/
    schema.ts       Definición de tablas: la fuente de verdad del modelo
    index.ts        Cliente de Drizzle + pool de conexiones
    seed.ts         Datos de ejemplo
  lib/
    posts.ts        Capa de dominio: qué significa gestionar entradas
    users.ts        Alta de usuarios y verificación de credenciales
    http.ts         Traducción de errores del dominio a códigos HTTP
    errors.ts       Errores del dominio (sin dependencia de HTTP)
    slug.ts         Generación de slugs
    auth/
      password.ts   Hash y verificación con argon2id
      session.ts    Sesiones en base de datos + cookie
      guards.ts     requireUser / requireAdmin / propiedad del contenido
    validation/     Esquemas Zod de entrada
drizzle/            Migraciones SQL generadas (se versionan en git)
```

La regla de oro: **las rutas no contienen lógica de negocio**. Un Route Handler
solo valida la entrada, llama a `src/lib/posts.ts` y traduce el resultado a
HTTP. Gracias a eso, el panel de la fase 4 podrá reutilizar exactamente las
mismas funciones sin pasar por la red.

## Modelo de datos actual

- **users** — `id`, `email` (único), `name`, `password_hash` (argon2id), `role`
  (`admin` | `editor`), `created_at`
- **sessions** — `id`, `token_hash` (único), `user_id` → users (cascade),
  `expires_at`, `created_at`
- **posts** — `id`, `title`, `slug` (único), `excerpt`, `body`, `status`
  (`draft` | `published`), `author_id` → users, `published_at`, `created_at`,
  `updated_at`

Permisos: un `editor` gestiona **sus propias** entradas; un `admin` gestiona
todas y además las cuentas.

Es un modelo **fijo**: las entradas están definidas en código. En la fase 5 lo
convertiremos en un modelo **dinámico**, donde el usuario define sus propios
tipos de contenido desde el panel. Ese salto es lo que separa un blog de un CMS.

## API

Toda la API requiere sesión. La API pública de solo lectura llega en la fase 6.

### Autenticación

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/login` | `{email, password}` → cookie `cms_session` (httpOnly) |
| `POST` | `/api/auth/logout` | Borra la sesión del servidor y la cookie |
| `GET` | `/api/auth/me` | Devuelve el usuario de la sesión actual |

### Usuarios (solo `admin`)

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/users` | Lista de cuentas |
| `POST` | `/api/users` | Crea una cuenta (`role`: `admin` \| `editor`) |

No hay registro público: las cuentas las crea un administrador.

### Contenido

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/posts` | Lista paginada. Query: `page`, `limit` (máx. 100), `status`, `q` |
| `POST` | `/api/posts` | Crea una entrada. Devuelve `201` + cabecera `Location` |
| `GET` | `/api/posts/:id` | Devuelve una entrada |
| `PATCH` | `/api/posts/:id` | Actualiza **solo** los campos enviados |
| `DELETE` | `/api/posts/:id` | Borra. Devuelve `204` sin cuerpo |

Códigos de error:

| Código | Cuándo |
|---|---|
| `400` | El cuerpo no es JSON válido, o el id no es un UUID |
| `404` | El recurso no existe |
| `409` | Conflicto: el slug ya está en uso |
| `422` | El JSON es válido pero los datos no pasan la validación (incluye `issues[]` por campo) |
| `401` | No hay sesión válida (identifícate) |
| `403` | Hay sesión, pero no permiso (no vuelvas a intentarlo igual) |
| `500` | Error inesperado (el detalle solo se registra en el servidor) |

Ejemplo:

```bash
curl -X POST http://localhost:3000/api/posts \
  -H 'content-type: application/json' \
  -d '{"title":"¿Cómo funciona un CMS?","body":"...","status":"published"}'
```

Si no envías `slug`, se deriva del título (`como-funciona-un-cms`).

## Roadmap

- [x] **Fase 1** — Andamiaje, Postgres en Docker, Drizzle, esquema inicial
- [x] **Fase 2** — API de contenido (CRUD) con validación (Zod)
- [x] **Fase 3** — Autenticación por sesión y roles
- [ ] **Fase 4** — Panel de administración (Server Actions)
- [ ] **Fase 5** — Tipos de contenido dinámicos
- [ ] **Fase 6** — Publicación, media, API pública y caché
