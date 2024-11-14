ALTER TABLE "media" ADD COLUMN "thumbnail_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_thumbnail_id_file_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
