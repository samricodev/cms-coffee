ALTER TYPE "public"."field_type" ADD VALUE 'relation';--> statement-breakpoint
ALTER TABLE "content_fields" ADD COLUMN "target_type_id" uuid;--> statement-breakpoint
ALTER TABLE "content_fields" ADD COLUMN "multiple" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "content_fields" ADD CONSTRAINT "content_fields_target_type_id_content_types_id_fk" FOREIGN KEY ("target_type_id") REFERENCES "public"."content_types"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_data_idx" ON "entries" USING gin ("data");