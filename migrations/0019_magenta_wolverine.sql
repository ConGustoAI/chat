ALTER TABLE "media" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "duration" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "resized_width" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "resized_height" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_start_x" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_start_y" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_end_x" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_end_y" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "duration_start" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "duration_end" real;