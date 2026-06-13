ALTER TABLE "roles" ADD COLUMN "tool_permissions" jsonb;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "last_activity" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "recovery_codes_hash" text;