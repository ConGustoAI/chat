ALTER TABLE "conversations" ADD COLUMN "assistant_name" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "model_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "model_name" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_model_id_assistants_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."assistants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
