ALTER TABLE "prompts" DROP CONSTRAINT "prompts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_in" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_out" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_in_cost" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_out_cost" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_reasoning" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_reasoning" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_reasoning_cost" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "tokens_reasoning_cost" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_in" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_out" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_in_cost" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_out_cost" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_reasoning" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_reasoning" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_reasoning_cost" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "tokens_reasoning_cost" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "prompts" DROP COLUMN IF EXISTS "user_id";