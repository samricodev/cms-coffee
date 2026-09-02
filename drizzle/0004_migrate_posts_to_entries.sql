INSERT INTO "content_types" ("name", "api_id", "description")
VALUES ('Artículo', 'articulo', 'Contenido migrado desde la tabla posts')
ON CONFLICT ("api_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "content_fields" ("content_type_id", "label", "api_key", "type", "required", "position")
SELECT "id", 'Extracto', 'excerpt', 'text'::field_type, false, 0 FROM "content_types" WHERE "api_id" = 'articulo'
UNION ALL
SELECT "id", 'Contenido', 'body', 'textarea'::field_type, false, 1 FROM "content_types" WHERE "api_id" = 'articulo'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

INSERT INTO "entries" (
  "id", "content_type_id", "title", "slug", "status", "data",
  "author_id", "published_at", "created_at", "updated_at"
)
SELECT
  p."id",
  ct."id",
  p."title",
  p."slug",
  p."status",
  jsonb_strip_nulls(
    jsonb_build_object('excerpt', p."excerpt", 'body', p."body")
  ),
  p."author_id",
  p."published_at",
  p."created_at",
  p."updated_at"
FROM "posts" p
CROSS JOIN "content_types" ct
WHERE ct."api_id" = 'articulo'
ON CONFLICT ("id") DO NOTHING;
