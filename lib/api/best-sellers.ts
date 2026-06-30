import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, products } from "@/lib/db/schema";
import { getSiteSetting, setSiteSetting } from "@/lib/site-settings";

export const BEST_SELLER_MODE_KEY = "best_seller_mode";
export const BEST_SELLER_LAST_AUTO_MONTH_KEY = "best_seller_last_auto_month";

export type BestSellerMode = "auto" | "manual";

export type ProductSalesMetric = {
  productId: string;
  monthlySold: number;
  trendingSold: number;
  totalSold: number;
};

export async function getBestSellerMode(): Promise<BestSellerMode> {
  const mode = await getSiteSetting(BEST_SELLER_MODE_KEY, "auto");
  return mode === "manual" ? "manual" : "auto";
}

export async function setBestSellerMode(mode: BestSellerMode) {
  await setSiteSetting(BEST_SELLER_MODE_KEY, mode);
}

export async function ensureMonthlyBestSellerEvaluation() {
  const mode = await getBestSellerMode();

  if (mode !== "auto") {
    return;
  }

  const currentMonth = getCurrentMonthKey();
  const lastAutoMonth = await getSiteSetting(BEST_SELLER_LAST_AUTO_MONTH_KEY);

  if (lastAutoMonth === currentMonth) {
    return;
  }

  await evaluateBestSellers();
}

export async function evaluateBestSellers() {
  const metrics = await getProductSalesMetrics();
  const topMonthly = pickTop(metrics, "monthlySold");
  const topTrending = pickTop(metrics, "trendingSold");

  const bestSellerIds =
    topMonthly.length > 0 ? topMonthly.map((item) => item.productId) : await fallbackIds("best");
  const trendingIds =
    topTrending.length > 0
      ? topTrending.map((item) => item.productId)
      : await fallbackIds("trending");

  await db.transaction(async (tx) => {
    await tx.update(products).set({
      isBestSeller: false,
      isFeatured: false,
      updatedAt: new Date(),
    });

    if (bestSellerIds.length > 0) {
      await tx
        .update(products)
        .set({
          isBestSeller: true,
          updatedAt: new Date(),
        })
        .where(inArray(products.id, bestSellerIds));
    }

    if (trendingIds.length > 0) {
      await tx
        .update(products)
        .set({
          isFeatured: true,
          updatedAt: new Date(),
        })
        .where(inArray(products.id, trendingIds));
    }
  });

  await setSiteSetting(BEST_SELLER_LAST_AUTO_MONTH_KEY, getCurrentMonthKey());

  return {
    bestSellerIds,
    trendingIds,
    metrics,
  };
}

export async function getProductSalesMetrics(): Promise<ProductSalesMetric[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const trendingStart = new Date(
    now.getTime() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const rows = await db
    .select({
      productId: products.id,
      monthlySold: sql<number>`coalesce(sum(case when ${orders.id} is not null and ${orders.createdAt} >= ${monthStart}::timestamptz then ${orderItems.quantity} else 0 end), 0)`,
      trendingSold: sql<number>`coalesce(sum(case when ${orders.id} is not null and ${orders.createdAt} >= ${trendingStart}::timestamptz then ${orderItems.quantity} else 0 end), 0)`,
      totalSold: sql<number>`coalesce(sum(case when ${orders.id} is not null then ${orderItems.quantity} else 0 end), 0)`,
    })
    .from(products)
    .leftJoin(orderItems, eq(orderItems.productId, products.id))
    .leftJoin(
      orders,
      sql`${orders.id} = ${orderItems.orderId} and ${orders.status} not in ('CANCELLED', 'REJECTED', 'REFUNDED', 'RETURNED')`,
    )
    .where(eq(products.isActive, true))
    .groupBy(products.id);

  return rows.map((row) => ({
    productId: row.productId,
    monthlySold: Number(row.monthlySold),
    trendingSold: Number(row.trendingSold),
    totalSold: Number(row.totalSold),
  }));
}

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function pickTop(
  metrics: ProductSalesMetric[],
  key: "monthlySold" | "trendingSold",
) {
  return metrics
    .filter((item) => item[key] > 0)
    .sort((left, right) => {
      if (right[key] !== left[key]) {
        return right[key] - left[key];
      }

      return right.totalSold - left.totalSold;
    })
    .slice(0, 4);
}

async function fallbackIds(type: "best" | "trending") {
  const rows = await db.query.products.findMany({
    where: eq(type === "best" ? products.isBestSeller : products.isFeatured, true),
    columns: { id: true },
    orderBy: desc(products.createdAt),
    limit: 4,
  });

  if (rows.length > 0) {
    return rows.map((row) => row.id);
  }

  const newest = await db.query.products.findMany({
    where: eq(products.isActive, true),
    columns: { id: true },
    orderBy: desc(products.createdAt),
    limit: 4,
  });

  return newest.map((row) => row.id);
}
