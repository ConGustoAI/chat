ALTER TABLE "media" RENAME COLUMN "pdf_images_skip" TO "images_skip";--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "video_as_images" boolean;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "video_as_file" boolean;--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "pdf_pages";