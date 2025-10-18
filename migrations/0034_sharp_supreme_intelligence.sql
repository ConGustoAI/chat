ALTER TABLE "assistants" ADD COLUMN "top_p_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assistants" ADD COLUMN "top_k_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "assistants" ADD COLUMN "max_tokens_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "top_p_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "top_k_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "max_tokens_enabled" boolean DEFAULT true NOT NULL;