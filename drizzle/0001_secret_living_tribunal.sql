CREATE TABLE "landing_page" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"headline" text NOT NULL,
	"subheadline" text,
	"cta_text" text DEFAULT 'Comenzar',
	"cta_url" text DEFAULT '#',
	"body_content" text,
	"theme" text DEFAULT 'default',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "landing_page" ADD CONSTRAINT "landing_page_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;