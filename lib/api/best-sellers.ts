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

const BEST_SELLER_LIMIT = 4;

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
  const topMonthly = pickTop(metrics, "monthlySold", BEST_SELLER_LIMIT);
  const topTrending = pickTop(metrics, "trendingSold", BEST_SELLER_LIMIT);

  const bestSellerIds = await fillFromPastSalesOrFallback(
    topMonthly.map((item) => item.productId),
    metrics,
    "best",
  );
  const trendingIds = await fillFromPastSalesOrFallback(
    topTrending.map((item) => item.productId),
    metrics,
    "trending",
  );

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
      sql`${orders.id} = ${orderItems.orderId} and ${orders.status}::text not in ('CANCELLED', 'REJECTED', 'REFUNDED', 'RETURNED')`,
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
  limit: number,
) {
  return metrics
    .filter((item) => item[key] > 0)
    .sort((left, right) => {
      if (right[key] !== left[key]) {
        return right[key] - left[key];
      }

      return right.totalSold - left.totalSold;
    })
    .slice(0, limit);
}

async function fillFromPastSalesOrFallback(
  selectedIds: string[],
  metrics: ProductSalesMetric[],
  type: "best" | "trending",
) {
  const ids = [...selectedIds];
  const selectedIdSet = new Set(ids);

  const historicalIds = metrics
    .filter((item) => item.totalSold > 0 && !selectedIdSet.has(item.productId))
    .sort((left, right) => right.totalSold - left.totalSold)
    .map((item) => item.productId);

  for (const productId of historicalIds) {
    ids.push(productId);
    selectedIdSet.add(productId);

    if (ids.length >= BEST_SELLER_LIMIT) {
      return ids;
    }
  }

  if (ids.length >= BEST_SELLER_LIMIT) {
    return ids;
  }

  const fallback = await fallbackIds(type, selectedIdSet, BEST_SELLER_LIMIT - ids.length);
  return [...ids, ...fallback];
}

async function fallbackIds(
  type: "best" | "trending",
  excludeIds: Set<string>,
  limit: number,
) {
  const rows = await db.query.products.findMany({
    where: eq(type === "best" ? products.isBestSeller : products.isFeatured, true),
    columns: { id: true },
    orderBy: desc(products.createdAt),
    limit: BEST_SELLER_LIMIT * 2,
  });

  const existingIds = rows
    .map((row) => row.id)
    .filter((productId) => !excludeIds.has(productId))
    .slice(0, limit);

  if (existingIds.length >= limit) {
    return existingIds;
  }

  const newest = await db.query.products.findMany({
    where: eq(products.isActive, true),
    columns: { id: true },
    orderBy: desc(products.createdAt),
    limit: BEST_SELLER_LIMIT * 2,
  });

  const existingIdSet = new Set([...excludeIds, ...existingIds]);
  const newestIds = newest
    .map((row) => row.id)
    .filter((productId) => !existingIdSet.has(productId))
    .slice(0, limit - existingIds.length);

  return [...existingIds, ...newestIds];
}
