ALTER TYPE "media_types" ADD VALUE 'pdf';--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "pdf_as_images" boolean;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "pdf_as_images_dpi" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "pdf_as_document" boolean;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "pdf_as_file" boolean;