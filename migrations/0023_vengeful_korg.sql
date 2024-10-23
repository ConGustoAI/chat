ALTER TABLE "media" DROP CONSTRAINT "media_resized_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "media_cropped_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "media" DROP CONSTRAINT "media_thumbnail_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "resized_id";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "cropped_id";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "thumbnail_id";