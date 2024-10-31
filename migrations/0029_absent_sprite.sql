ALTER TABLE "api_keys" ADD COLUMN "usage" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "remainder" real DEFAULT 0 NOT NULL;