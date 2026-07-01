ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "courier_name" text;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "tracking_number" text;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "tracking_url" text;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "cod_amount_due" numeric(10, 2);

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "cod_collected_at" timestamp with time zone;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "dispatched_at" timestamp with time zone;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "out_for_delivery_at" timestamp with time zone;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "delivered_at" timestamp with time zone;

CREATE INDEX IF NOT EXISTS "orders_tracking_number_idx" ON "orders" USING btree ("tracking_number");
