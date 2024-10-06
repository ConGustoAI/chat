ALTER TABLE "messages" DROP CONSTRAINT "messages_media_id_media_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "media_id" SET DATA TYPE uuid[];--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "media_id" SET DEFAULT ARRAY[]::uuid[];--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "conversation_id" uuid;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "reuse" boolean DEFAULT true;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "media" ADD CONSTRAINT "media_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
