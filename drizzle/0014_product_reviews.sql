CREATE TABLE IF NOT EXISTS "product_reviews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "rating" integer NOT NULL,
  "title" text,
  "comment" text NOT NULL,
  "verified_purchase" boolean DEFAULT false NOT NULL,
  "is_approved" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_product_user_unique" ON "product_reviews" USING btree ("product_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_product_id_idx" ON "product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_user_id_idx" ON "product_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_is_approved_idx" ON "product_reviews" USING btree ("is_approved");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_reviews_created_at_idx" ON "product_reviews" USING btree ("created_at");
