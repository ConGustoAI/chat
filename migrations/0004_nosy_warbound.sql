ALTER TABLE "auth_user" DROP CONSTRAINT "auth_user_username_unique";--> statement-breakpoint
ALTER TABLE "auth_user" ALTER COLUMN "username" DROP NOT NULL;