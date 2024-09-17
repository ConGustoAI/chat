ALTER TABLE "users" ALTER COLUMN "cost_show" SET DEFAULT 0.05;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "cost_warn1" SET DEFAULT 0.5;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "cost_warn2" SET DEFAULT 5;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "show_info" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_estimate" boolean DEFAULT false;