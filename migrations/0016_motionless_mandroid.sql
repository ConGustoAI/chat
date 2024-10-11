DO $$ BEGIN
 CREATE TYPE "public"."upload_status" AS ENUM('progress', 'ok', 'failed', 'deleted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"is_thumbnail" boolean,
	"status" "upload_status",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"update_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_image" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"update_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "message_media";--> statement-breakpoint
ALTER TABLE "media" ALTER COLUMN "duration" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_id" uuid[] DEFAULT ARRAY[]::uuid[];--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "order" serial NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "conversation_id" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "reuse" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "active" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "resized_width" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "resized_height" integer;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_start_x" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_start_y" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_end_x" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "crop_end_y" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "duration_start" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "duration_end" real;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "original_id" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "resized_id" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "cropped_id" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "thumbnail_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file" ADD CONSTRAINT "file_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_image" ADD CONSTRAINT "file_image_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_image" ADD CONSTRAINT "file_image_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_original_id_file_id_fk" FOREIGN KEY ("original_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_resized_id_file_id_fk" FOREIGN KEY ("resized_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_cropped_id_file_id_fk" FOREIGN KEY ("cropped_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_thumbnail_id_file_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "filetype";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "file_id";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "hash";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "filesize";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "image_width";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "image_height";--> statement-breakpoint
ALTER TABLE "media" DROP COLUMN IF EXISTS "upload_status";