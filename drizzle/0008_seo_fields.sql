ALTER TABLE "entries" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "seo_image_id" uuid;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;