ALTER TABLE "users" ADD COLUMN "cost_show" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cost_warn1" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cost_warn2" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_info" boolean DEFAULT true;