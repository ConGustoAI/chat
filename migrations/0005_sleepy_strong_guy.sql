ALTER TABLE "users" ALTER COLUMN "assistant" SET DEFAULT '00000000-0000-0000-0000-000000000000';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_assistant" text;