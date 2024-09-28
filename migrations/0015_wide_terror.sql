ALTER TABLE "conversations" ADD COLUMN "tokens_reasoning" integer;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "tokens_reasoning_cost" real;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tokens_reasoning" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tokens_reasoning_cost" real;