UPDATE "content_fields" SET "type" = 'richtext'
WHERE "api_key" = 'body'
  AND "content_type_id" = (SELECT "id" FROM "content_types" WHERE "api_id" = 'articulo');
--> statement-breakpoint

DELETE FROM "content_fields"
WHERE "api_key" = 'producto'
  AND "content_type_id" = (SELECT "id" FROM "content_types" WHERE "api_id" = 'articulo');
--> statement-breakpoint

UPDATE "entries" SET "data" = "data" - 'producto'
WHERE "content_type_id" = (SELECT "id" FROM "content_types" WHERE "api_id" = 'articulo');
--> statement-breakpoint

DELETE FROM "content_fields"
WHERE "api_key" IN ('disponible', 'lanzamiento')
  AND "content_type_id" = (SELECT "id" FROM "content_types" WHERE "api_id" = 'producto');
--> statement-breakpoint

UPDATE "entries" SET "data" = "data" - 'disponible' - 'lanzamiento'
WHERE "content_type_id" = (SELECT "id" FROM "content_types" WHERE "api_id" = 'producto');
--> statement-breakpoint

UPDATE "content_fields"
SET "choices" = '["espresso","filtrado","con leche","repostería","grano","merch"]'::jsonb
WHERE "api_key" = 'categoria'
  AND "content_type_id" = (SELECT "id" FROM "content_types" WHERE "api_id" = 'producto');
--> statement-breakpoint

UPDATE "entries"
SET "data" = jsonb_set("data", '{categoria}', '"merch"')
WHERE "content_type_id" = (SELECT "id" FROM "content_types" WHERE "api_id" = 'producto')
  AND "data" ->> 'categoria' = 'tazas';
