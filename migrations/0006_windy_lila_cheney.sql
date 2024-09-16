ALTER TABLE "conversations" ADD COLUMN "tokens_in_cost" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "tokens_out_cost" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tokens_in_cost" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tokens_out_cost" real DEFAULT 0;