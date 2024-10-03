ALTER TABLE "file" RENAME COLUMN "preview" TO "is_thumbnail";--> statement-breakpoint
ALTER TABLE "file" ALTER COLUMN "is_thumbnail" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "thumbnail_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_thumbnail_id_file_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "file" DROP COLUMN IF EXISTS "file_name";--> statement-breakpoint
ALTER TABLE "file" DROP COLUMN IF EXISTS "preview_size";--> statement-breakpoint
ALTER TABLE "file" DROP COLUMN IF EXISTS "preview_mime_type";--> statement-breakpoint
ALTER TABLE "file" DROP COLUMN IF EXISTS "preview_status";