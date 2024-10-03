DO $$ BEGIN
 CREATE TYPE "public"."upload_status" AS ENUM('progress', 'ok', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "file" ADD COLUMN "status" "upload_status";