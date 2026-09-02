import { and, eq, sql } from "drizzle-orm";

import { hashPassword } from "../lib/auth/password";
import { db } from "./index";
import {
  contentFields,
  contentTypes,
  entries,
  users,
  type ContentType,
} from "./schema";

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "contrasena-de-desarrollo";

type FieldSeed = {
  label: string;
  apiKey: string;
  type:
    | "text"
    | "textarea"
    | "richtext"
    | "number"
    | "boolean"
    | "date"
    | "select"
    | "tags"
    | "media"
    | "relation";
  required?: boolean;
  choices?: string[];
  targetTypeId?: string;
  multiple?: boolean;
};

async function upsertType(
  name: string,
  apiId: string,
  description: string,
  fields: FieldSeed[],
): Promise<ContentType> {
  await db
    .insert(contentTypes)
    .values({ name, apiId, description })
    .onConflictDoNothing({ target: contentTypes.apiId });

  const [type] = await db
    .select()
    .from(contentTypes)
    .where(eq(contentTypes.apiId, apiId))
    .limit(1);

  const existing = await db
    .select({ apiKey: contentFields.apiKey })
    .from(contentFields)
    .where(eq(contentFields.contentTypeId, type.id));

  const missing = fields.filter(
    (field) => !existing.some((row) => row.apiKey === field.apiKey),
  );

  if (missing.length > 0) {
    await db.insert(contentFields).values(
      missing.map((field, index) => ({
        contentTypeId: type.id,
        label: field.label,
        apiKey: field.apiKey,
        type: field.type,
        required: field.required ?? false,
        choices: field.choices ?? null,
        targetTypeId: field.targetTypeId ?? null,
        multiple: field.multiple ?? false,
        position: existing.length + index,
      })),
    );
  }

  return type;
}


async function slugToId(contentTypeId: string): Promise<Record<string, string>> {
  const rows = await db
    .select({ id: entries.id, slug: entries.slug })
    .from(entries)
    .where(eq(entries.contentTypeId, contentTypeId));

  return Object.fromEntries(rows.map((row) => [row.slug, row.id]));
}

const now = new Date();

async function seedCafes(contentTypeId: string, authorId?: string) {
  await db
    .insert(entries)
    .values(
      [
        {
          title: "Chelbesa",
          slug: "chelbesa",
          seoDescription:
            "Etiopía, Gedeb. Proceso natural, notas de jazmín, melocotón y bergamota.",
          data: {
            tostador: "Cadeco",
            pais: "Etiopía",
            origen: "Gedeb, Yirgacheffe",
            productor: "Estación de lavado de Chelbesa",
            variedad: "Heirloom",
            proceso: "natural",
            altitud: 1950,
            tueste: "claro",
            notas: ["jazmín", "melocotón", "bergamota"],
            puntuacion: 88.5,
          },
        },
        {
          title: "El Diviso",
          slug: "el-diviso",
          seoDescription:
            "Colombia, Huila. Fermentación anaeróbica con notas de lichi y naranja.",
          data: {
            tostador: "Cadeco",
            pais: "Colombia",
            origen: "Bruselas, Huila",
            productor: "Nestor Lasso",
            variedad: "Castillo",
            proceso: "anaeróbico",
            altitud: 1750,
            tueste: "claro",
            notas: ["lichi", "cacao", "naranja"],
            puntuacion: 87,
          },
        },
        {
          title: "Finca La Esperanza",
          slug: "finca-la-esperanza",
          seoDescription:
            "Guatemala, Huehuetenango. Lavado clásico: caramelo, almendra y manzana roja.",
          data: {
            tostador: "Tostaduría del Centro",
            pais: "Guatemala",
            origen: "Huehuetenango",
            productor: "Familia Herrera",
            variedad: "Bourbon",
            proceso: "lavado",
            altitud: 1600,
            tueste: "medio",
            notas: ["caramelo", "almendra", "manzana roja"],
            puntuacion: 85.5,
          },
        },
        {
          title: "Kiamugumo",
          slug: "kiamugumo",
          seoDescription:
            "Kenia, Kirinyaga. SL28 lavado, con grosella negra y azúcar morena.",
          data: {
            tostador: "Cadeco",
            pais: "Kenia",
            origen: "Kirinyaga",
            productor: "Cooperativa Rungeto",
            variedad: "SL28",
            proceso: "lavado",
            altitud: 1800,
            tueste: "claro",
            notas: ["grosella negra", "tomate", "azúcar morena"],
            puntuacion: 88,
          },
        },
        {
          title: "Bella Vista",
          slug: "bella-vista",
          seoDescription:
            "México, Chiapas. Honey de altura con panela, nuez y cacao. Nuestra base de leche.",
          data: {
            tostador: "Tostaduría del Centro",
            pais: "México",
            origen: "Jaltenango, Chiapas",
            productor: "Cooperativa Bella Vista",
            variedad: "Typica",
            proceso: "honey",
            altitud: 1400,
            tueste: "medio",
            notas: ["panela", "nuez", "cacao"],
            puntuacion: 84,
          },
        },
      ].map((item) => ({
        ...item,
        contentTypeId,
        status: "published" as const,
        publishedAt: now,
        authorId,
      })),
    )
    .onConflictDoNothing();
}

async function seedEntries(
  articuloId: string,
  productoId: string,
  eventoId: string,
  paginaId: string,
  cafes: Record<string, string>,
  authorId?: string,
) {
  const publicado = {
    status: "published" as const,
    publishedAt: now,
    authorId,
  };

  await db
    .insert(entries)
    .values([
      {
        ...publicado,
        contentTypeId: articuloId,
        title: "Cómo preparamos el V60",
        slug: "como-preparamos-el-v60",
        seoDescription: "Nuestra receta de V60: 15 g, 250 ml y tres vertidos.",
        data: {
          excerpt: "La receta que usamos en barra, paso a paso.",
          seccion: "guías",
          destacado: false,
          body: [
            "## La receta",
            "",
            "15 g de café molido medio, 250 ml de agua a 93 °C, tres vertidos.",
            "",
            "1. **Preinfusión**: 45 ml, esperar 30 segundos.",
            "2. **Segundo vertido**: hasta 150 ml en círculos lentos.",
            "3. **Tercero**: hasta 250 ml y dejar drenar.",
            "",
            "El total ronda los 2:45. Si tarda más de 3:30, muele más grueso.",
          ].join("\n"),
        },
      },
      {
        ...publicado,
        contentTypeId: articuloId,
        title: "Qué significa proceso natural",
        slug: "que-significa-proceso-natural",
        seoDescription:
          "El proceso natural seca la cereza entera y por eso sabe a fruta.",
        data: {
          excerpt: "Por qué el mismo grano sabe distinto según cómo se seque.",
          seccion: "origen",
          destacado: false,
          cafe: cafes["chelbesa"],
          body: [
            "En el proceso **lavado** se retira la pulpa antes de secar el grano.",
            "En el **natural** la cereza se seca entera, y el azúcar de la fruta",
            "acaba en la taza.",
            "",
            "Por eso un natural etíope como [Chelbesa](/cafes/chelbesa) sabe a",
            "melocotón, y un lavado guatemalteco sabe a almendra.",
          ].join("\n"),
        },
      },
      {
        ...publicado,
        contentTypeId: articuloId,
        title: "Chelbesa, nuestro café del mes",
        slug: "chelbesa-cafe-del-mes",
        seoDescription: "Un natural de Gedeb con 88,5 puntos, en filtrado toda la semana.",
        data: {
          excerpt: "Un natural de Gedeb que huele a jazmín antes de llegar a la mesa.",
          seccion: "novedades",
          destacado: true,
          cafe: cafes["chelbesa"],
          body: [
            "Lo trajimos en enero y lleva tres semanas en el V60.",
            "",
            "> Huele a jazmín antes de que llegue a la mesa.",
            "",
            "Está en carta como filtrado y en bolsa de 250 g para llevar.",
          ].join("\n"),
        },
      },
      {
        ...publicado,
        contentTypeId: eventoId,
        title: "Cata de orígenes africanos",
        slug: "cata-origenes-africanos",
        seoDescription: "Etiopía y Kenia, cinco tazas y dos horas. Plazas limitadas.",
        data: {
          fecha: "2026-10-17",
          modalidad: "presencial",
          aforo: 12,
          precio: 350,
          descripcion: [
            "Dos horas comparando **Etiopía** y **Kenia** en cinco tazas.",
            "",
            "No hace falta experiencia previa.",
          ].join("\n"),
        },
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(entries)
    .values(
      [
        {
          title: "Espresso",
          slug: "espresso",
          data: { codigo: "ESP-S", precio: 38, categoria: "espresso", descripcion: "Doble, 40 ml." },
        },
        {
          title: "Cortado",
          slug: "cortado",
          data: { codigo: "COR-S", precio: 45, categoria: "con leche", descripcion: "Espresso con un toque de leche texturizada." },
        },
        {
          title: "Latte 355 ml",
          slug: "latte-355",
          data: {
            codigo: "LAT-12",
            precio: 65,
            categoria: "con leche",
            descripcion: "Con Bella Vista de base: panela y nuez con leche entera.",
            cafe: cafes["bella-vista"],
          },
        },
        {
          title: "V60",
          slug: "v60",
          data: {
            codigo: "V60-S",
            precio: 75,
            categoria: "filtrado",
            descripcion: "Filtrado del café del mes, servido en jarra.",
            cafe: cafes["chelbesa"],
          },
        },
        {
          title: "Croissant de mantequilla",
          slug: "croissant-de-mantequilla",
          data: { codigo: "CROI", precio: 48, categoria: "repostería", descripcion: "Horneado cada mañana." },
        },
        {
          title: "Chelbesa 250 g",
          slug: "chelbesa-250g",
          data: {
            codigo: "GRA-CHEL-250",
            precio: 320,
            categoria: "grano",
            descripcion: "Bolsa de 250 g para llevar. Tueste para filtrado.",
            cafe: cafes["chelbesa"],
          },
        },
      ].map((item) => ({ ...item, ...publicado, contentTypeId: productoId })),
    )
    .onConflictDoNothing();

  await db
    .insert(entries)
    .values(
      [
        {
          title: "Quiénes somos",
          slug: "quienes-somos",
          seoDescription: "Una cafetería de especialidad con tostado propio.",
          data: {
            cuerpo: [
              "Abrimos en 2024 con una idea sencilla: **servir café que se pueda rastrear**",
              "hasta quien lo cultivó.",
              "",
              "Trabajamos con dos tostadores y rotamos orígenes cada mes.",
            ].join("\n"),
          },
        },
        {
          title: "Cómo llegar",
          slug: "como-llegar",
          seoDescription: "Dónde estamos y a qué hora abrimos.",
          data: {
            cuerpo: [
              "## Horario",
              "",
              "- Lunes a viernes: 7:30 – 20:00",
              "- Sábado y domingo: 9:00 – 19:00",
              "",
              "## Dónde",
              "",
              "En el centro, a dos calles de la plaza.",
            ].join("\n"),
          },
        },
      ].map((item) => ({ ...item, ...publicado, contentTypeId: paginaId })),
    )
    .onConflictDoNothing();
}

async function seed() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const [admin] = await db
    .insert(users)
    .values([
      { email: "admin@cms.local", name: "Admin", passwordHash, role: "admin" },
      { email: "editor@cms.local", name: "Editor", passwordHash, role: "editor" },
    ])
    .onConflictDoUpdate({ target: users.email, set: { passwordHash } })
    .returning();

  const cafe = await upsertType("Café", "cafe", "Los orígenes que servimos.", [
    { label: "Tostador", apiKey: "tostador", type: "text" },
    {
      label: "País",
      apiKey: "pais",
      type: "select",
      required: true,
      choices: [
        "Brasil",
        "Colombia",
        "Etiopía",
        "Guatemala",
        "Honduras",
        "Kenia",
        "México",
        "Perú",
      ],
    },
    { label: "Región o finca", apiKey: "origen", type: "text" },
    { label: "Productor", apiKey: "productor", type: "text" },
    { label: "Variedad", apiKey: "variedad", type: "text" },
    {
      label: "Proceso",
      apiKey: "proceso",
      type: "select",
      required: true,
      choices: ["lavado", "natural", "honey", "anaeróbico"],
    },
    { label: "Altitud (msnm)", apiKey: "altitud", type: "number" },
    {
      label: "Tueste",
      apiKey: "tueste",
      type: "select",
      choices: ["claro", "medio", "oscuro"],
    },
    { label: "Notas de cata", apiKey: "notas", type: "tags" },
    { label: "Puntuación SCA", apiKey: "puntuacion", type: "number" },
    { label: "Foto", apiKey: "foto", type: "media" },
  ]);

  const pagina = await upsertType(
    "Página",
    "pagina",
    "Páginas sueltas del sitio.",
    [{ label: "Cuerpo", apiKey: "cuerpo", type: "richtext", required: true }],
  );

  const articulo = await upsertType(
    "Artículo",
    "articulo",
    "Blog y guías de la cafetería.",
    [
      { label: "Extracto", apiKey: "excerpt", type: "text" },
      { label: "Contenido", apiKey: "body", type: "richtext" },
      { label: "Portada", apiKey: "portada", type: "media" },
      {
        label: "Sección",
        apiKey: "seccion",
        type: "select",
        choices: ["guías", "origen", "recetas", "novedades"],
      },
      {
        label: "Café del que habla",
        apiKey: "cafe",
        type: "relation",
        targetTypeId: cafe.id,
      },
      { label: "Destacado", apiKey: "destacado", type: "boolean" },
    ],
  );

  const producto = await upsertType(
    "Producto",
    "producto",
    "La carta. El precio vivirá aquí hasta que exista el sistema de inventario.",
    [
      { label: "Código", apiKey: "codigo", type: "text", required: true },
      { label: "Precio", apiKey: "precio", type: "number", required: true },
      {
        label: "Categoría",
        apiKey: "categoria",
        type: "select",
        required: true,
        choices: [
          "espresso",
          "filtrado",
          "con leche",
          "repostería",
          "grano",
          "merch",
        ],
      },
      { label: "Descripción", apiKey: "descripcion", type: "textarea" },
      { label: "Foto", apiKey: "foto", type: "media" },
      {
        label: "Café que lleva",
        apiKey: "cafe",
        type: "relation",
        targetTypeId: cafe.id,
      },
    ],
  );

  const evento = await upsertType(
    "Evento",
    "evento",
    "Catas, talleres y presentaciones.",
    [
      { label: "Fecha", apiKey: "fecha", type: "date", required: true },
      {
        label: "Modalidad",
        apiKey: "modalidad",
        type: "select",
        choices: ["presencial", "online"],
      },
      { label: "Aforo", apiKey: "aforo", type: "number" },
      { label: "Precio", apiKey: "precio", type: "number" },
      { label: "Descripción", apiKey: "descripcion", type: "richtext" },
    ],
  );

  // `codigo` es obligatorio y se añadió a un tipo con contenido ya existente:
  // sin este relleno esas entradas no pasarían la validación al editarlas.
  await db
    .update(entries)
    .set({ data: sql`"data" || jsonb_build_object('codigo', upper("slug"))` })
    .where(
      and(eq(entries.contentTypeId, producto.id), sql`not ("data" ? 'codigo')`),
    );

  await seedCafes(cafe.id, admin?.id);
  const cafeIds = await slugToId(cafe.id);

  await seedEntries(
    articulo.id,
    producto.id,
    evento.id,
    pagina.id,
    cafeIds,
    admin?.id,
  );

  const total = await db.select().from(entries);
  console.log(`Seed completado. Entradas en la base: ${total.length}`);
  console.log("Cuentas: admin@cms.local / editor@cms.local");
  console.log(`Contraseña: ${SEED_PASSWORD}`);
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
