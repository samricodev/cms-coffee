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
npm run db:seed              # datos de ejemplo
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
  app/          Rutas (App Router). Por ahora solo la portada de prueba.
  db/
    schema.ts   Definición de tablas: la fuente de verdad del modelo
    index.ts    Cliente de Drizzle + pool de conexiones
    seed.ts     Datos de ejemplo
drizzle/        Migraciones SQL generadas (se versionan en git)
```

## Modelo de datos actual

- **users** — `id`, `email` (único), `name`, `password_hash`, `role`
  (`admin` | `editor`), `created_at`
- **posts** — `id`, `title`, `slug` (único), `excerpt`, `body`, `status`
  (`draft` | `published`), `author_id` → users, `published_at`, `created_at`,
  `updated_at`

Es un modelo **fijo**: las entradas están definidas en código. En la fase 5 lo
convertiremos en un modelo **dinámico**, donde el usuario define sus propios
tipos de contenido desde el panel. Ese salto es lo que separa un blog de un CMS.

## Roadmap

- [x] **Fase 1** — Andamiaje, Postgres en Docker, Drizzle, esquema inicial
- [ ] **Fase 2** — API de contenido (CRUD) con validación (Zod)
- [ ] **Fase 3** — Autenticación por sesión y roles
- [ ] **Fase 4** — Panel de administración (Server Actions)
- [ ] **Fase 5** — Tipos de contenido dinámicos
- [ ] **Fase 6** — Publicación, media, API pública y caché
