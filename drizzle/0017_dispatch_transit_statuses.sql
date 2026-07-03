ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'DISPATCHED' AFTER 'PROCESSING';
--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE IF NOT EXISTS 'IN_TRANSIT' AFTER 'SHIPPED';
