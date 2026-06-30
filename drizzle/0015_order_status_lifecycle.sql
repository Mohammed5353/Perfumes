CREATE TYPE "public"."order_status_new" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED');--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "status" TYPE "public"."order_status_new" USING (
  CASE "status"::text
    WHEN 'CONFIRMED' THEN 'ACCEPTED'
    WHEN 'PAID' THEN 'PROCESSING'
    ELSE "status"::text
  END
)::"public"."order_status_new";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "public"."order_status_new" USING (
  CASE "status"::text
    WHEN 'CONFIRMED' THEN 'ACCEPTED'
    WHEN 'PAID' THEN 'PROCESSING'
    ELSE "status"::text
  END
)::"public"."order_status_new";--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
ALTER TYPE "public"."order_status_new" RENAME TO "order_status";--> statement-breakpoint
ALTER TABLE "order_status_history" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
