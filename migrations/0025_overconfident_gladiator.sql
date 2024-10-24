ALTER TABLE "assistants" ADD COLUMN "pdf" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "pdf" boolean DEFAULT false NOT NULL;