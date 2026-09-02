import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";


export const userRole = pgEnum("user_role", ["admin", "editor"]);
export const postStatus = pgEnum("post_status", ["draft", "published"]);
export const fieldType = pgEnum("field_type", [
  "text",
  "textarea",
  "number",
  "boolean",
  "date",
  "select",
  "media",
  "tags",
  "richtext",
  "relation",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("editor"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_idx").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("sessions_token_hash_idx").on(table.tokenHash)],
);
export const contentTypes = pgTable(
  "content_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    apiId: text("api_id").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("content_types_api_id_idx").on(table.apiId)],
);

export const contentFields = pgTable(
  "content_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentTypeId: uuid("content_type_id")
      .notNull()
      .references(() => contentTypes.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    apiKey: text("api_key").notNull(),
    type: fieldType("type").notNull(),
    required: boolean("required").notNull().default(false),
    position: integer("position").notNull().default(0),
    choices: jsonb("choices").$type<string[]>(),
    targetTypeId: uuid("target_type_id").references(
      (): AnyPgColumn => contentTypes.id,
      { onDelete: "restrict" },
    ),
    multiple: boolean("multiple").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("content_fields_key_idx").on(table.contentTypeId, table.apiKey),
  ],
);

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentTypeId: uuid("content_type_id")
      .notNull()
      .references(() => contentTypes.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    status: postStatus("status").notNull().default("draft"),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    seoDescription: text("seo_description"),
    seoImageId: uuid("seo_image_id").references(() => media.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("entries_type_slug_idx").on(table.contentTypeId, table.slug),
    index("entries_data_idx").using("gin", table.data),
  ],
);

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storageKey: text("storage_key").notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ContentType = typeof contentTypes.$inferSelect;
export type ContentField = typeof contentFields.$inferSelect;
export type FieldType = ContentField["type"];
export type Entry = typeof entries.$inferSelect;
export type ContentTypeWithFields = ContentType & { fields: ContentField[] };
export type Media = typeof media.$inferSelect;
export type Session = typeof sessions.$inferSelect;
