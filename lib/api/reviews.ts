import { and, count, desc, eq, sql } from "drizzle-orm";
import { findProductByIdOrSlug } from "@/lib/api/catalog";
import { db, sqlClient } from "@/lib/db";
import { orderItems, orders, productReviews } from "@/lib/db/schema";
import type {
  AdminReviewItem,
  ProductReviewItem,
  ReviewSummary,
} from "@/lib/review-types";

type ProductReviewRow = typeof productReviews.$inferSelect;
type ProductReviewWithUser = ProductReviewRow & {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};
type AdminReviewWithRelations = ProductReviewWithUser & {
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
};

let productReviewsTableReadyPromise: Promise<void> | null = null;

export async function getProductReviewFeed(productId: string, limit = 10) {
  try {
    const [summaryRows, reviewRows] = await Promise.all([
      db
        .select({
          totalReviews: count(),
          averageRating: sql<number>`coalesce(avg(${productReviews.rating}), 0)`,
          verifiedPurchaseReviews: sql<number>`coalesce(sum(case when ${productReviews.verifiedPurchase} then 1 else 0 end), 0)`,
          rating1: sql<number>`coalesce(sum(case when ${productReviews.rating} = 1 then 1 else 0 end), 0)`,
          rating2: sql<number>`coalesce(sum(case when ${productReviews.rating} = 2 then 1 else 0 end), 0)`,
          rating3: sql<number>`coalesce(sum(case when ${productReviews.rating} = 3 then 1 else 0 end), 0)`,
          rating4: sql<number>`coalesce(sum(case when ${productReviews.rating} = 4 then 1 else 0 end), 0)`,
          rating5: sql<number>`coalesce(sum(case when ${productReviews.rating} = 5 then 1 else 0 end), 0)`,
        })
        .from(productReviews)
        .where(and(eq(productReviews.productId, productId), eq(productReviews.isApproved, true))),
      db.query.productReviews.findMany({
        where: and(eq(productReviews.productId, productId), eq(productReviews.isApproved, true)),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [desc(productReviews.createdAt)],
        limit,
      }),
    ]);

    const summaryRow = summaryRows[0] ?? {
      totalReviews: 0,
      averageRating: 0,
      verifiedPurchaseReviews: 0,
      rating1: 0,
      rating2: 0,
      rating3: 0,
      rating4: 0,
      rating5: 0,
    };

    return {
      summary: {
        totalReviews: Number(summaryRow.totalReviews),
        averageRating: Number(summaryRow.averageRating),
        verifiedPurchaseReviews: Number(summaryRow.verifiedPurchaseReviews),
        ratingCounts: {
          1: Number(summaryRow.rating1),
          2: Number(summaryRow.rating2),
          3: Number(summaryRow.rating3),
          4: Number(summaryRow.rating4),
          5: Number(summaryRow.rating5),
        },
      } satisfies ReviewSummary,
      reviews: reviewRows.map(serializeProductReview),
    };
  } catch (error) {
    if (isMissingProductReviewsTableError(error)) {
      console.warn("product_reviews table is missing; returning empty review feed", {
        productId,
      });

      return emptyReviewFeed();
    }

    throw error;
  }
}

export async function getProductReviewBundle(productIdOrSlug: string, limit = 10) {
  const product = await findProductByIdOrSlug(productIdOrSlug);

  if (!product) {
    return null;
  }

  const feed = await getProductReviewFeed(product.id, limit);

  return {
    product,
    ...feed,
  };
}

export async function getAdminReviews(limit = 500) {
  try {
    const rows = await db.query.productReviews.findMany({
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          columns: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
      },
      orderBy: [desc(productReviews.createdAt)],
      limit,
    });

    return rows.map(serializeAdminReview);
  } catch (error) {
    if (isMissingProductReviewsTableError(error)) {
      console.warn("product_reviews table is missing; returning empty admin review list");
      return [];
    }

    throw error;
  }
}

export async function createOrUpdateReview(input: {
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
}) {
  try {
    await saveReview(input);
  } catch (error) {
    if (!isMissingProductReviewsTableError(error)) {
      throw error;
    }

    await ensureProductReviewsTable();
    await saveReview(input);
  }

  return getLatestProductReview(input.productId, input.userId);
}

export async function deleteReviewById(reviewId: string) {
  await db.delete(productReviews).where(eq(productReviews.id, reviewId));
}

export async function isVerifiedPurchase(productId: string, userId: string) {
  const row = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(eq(orderItems.productId, productId), eq(orders.userId, userId)))
    .limit(1);

  return row.length > 0;
}

async function getLatestProductReview(productId: string, userId: string) {
  const row = await db.query.productReviews.findFirst({
    where: and(eq(productReviews.productId, productId), eq(productReviews.userId, userId)),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return row ? serializeProductReview(row) : null;
}

function serializeProductReview(
  review: ProductReviewWithUser,
): ProductReviewItem {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    verifiedPurchase: review.verifiedPurchase,
    isApproved: review.isApproved,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
    user: {
      id: review.user.id,
      name: review.user.name,
      email: review.user.email,
    },
  };
}

function serializeAdminReview(
  review: AdminReviewWithRelations,
): AdminReviewItem {
  return {
    ...serializeProductReview(review),
    product: {
      id: review.product.id,
      name: review.product.name,
      slug: review.product.slug,
      image: review.product.image,
    },
  };
}

function emptyReviewFeed(): {
  summary: ReviewSummary;
  reviews: ProductReviewItem[];
} {
  return {
    summary: {
      totalReviews: 0,
      averageRating: 0,
      verifiedPurchaseReviews: 0,
      ratingCounts: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    },
    reviews: [],
  };
}

async function saveReview(input: {
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
}) {
  await db
    .insert(productReviews)
    .values({
      productId: input.productId,
      userId: input.userId,
      rating: input.rating,
      title: input.title,
      comment: input.comment,
      verifiedPurchase: input.verifiedPurchase,
      isApproved: true,
    })
    .onConflictDoUpdate({
      target: [productReviews.productId, productReviews.userId],
      set: {
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        verifiedPurchase: input.verifiedPurchase,
        isApproved: true,
        updatedAt: new Date(),
      },
    });
}

async function ensureProductReviewsTable() {
  if (!productReviewsTableReadyPromise) {
    productReviewsTableReadyPromise = (async () => {
      await sqlClient.unsafe(`
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
        );
      `);
      await sqlClient.unsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "product_reviews_product_user_unique"
        ON "product_reviews" USING btree ("product_id","user_id");
      `);
      await sqlClient.unsafe(`
        CREATE INDEX IF NOT EXISTS "product_reviews_product_id_idx"
        ON "product_reviews" USING btree ("product_id");
      `);
      await sqlClient.unsafe(`
        CREATE INDEX IF NOT EXISTS "product_reviews_user_id_idx"
        ON "product_reviews" USING btree ("user_id");
      `);
      await sqlClient.unsafe(`
        CREATE INDEX IF NOT EXISTS "product_reviews_is_approved_idx"
        ON "product_reviews" USING btree ("is_approved");
      `);
      await sqlClient.unsafe(`
        CREATE INDEX IF NOT EXISTS "product_reviews_created_at_idx"
        ON "product_reviews" USING btree ("created_at");
      `);
    })().catch((error) => {
      productReviewsTableReadyPromise = null;
      throw error;
    });
  }

  await productReviewsTableReadyPromise;
}

function isMissingProductReviewsTableError(error: unknown) {
  for (let current: unknown = error; current && typeof current === "object"; current = (current as { cause?: unknown }).cause) {
    const code = (current as { code?: unknown }).code;
    if (code === "42P01") {
      return true;
    }

    const message = (current as { message?: unknown }).message;
    if (typeof message === "string" && message.includes('relation "product_reviews" does not exist')) {
      return true;
    }
  }

  return false;
}
