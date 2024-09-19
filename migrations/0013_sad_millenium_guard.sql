ALTER TABLE "conversations" ADD COLUMN "provider_id" uuid;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "provider_name" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "conversations" ADD CONSTRAINT "conversations_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
