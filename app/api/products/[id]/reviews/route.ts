import { notFound, ok, unauthorized, badRequest } from "@/lib/api/http";
import { rateLimitOrResponse } from "@/lib/api/rate-limit";
import { requireCustomerUser } from "@/lib/user-auth";
import { findProductByIdOrSlug } from "@/lib/api/catalog";
import {
  createOrUpdateReview,
  getProductReviewFeed,
  isVerifiedPurchase,
} from "@/lib/api/reviews";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const limited = rateLimitOrResponse(request, {
    id: "product-reviews:get",
    limit: 120,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const { id } = await context.params;
  const product = await findProductByIdOrSlug(id);

  if (!product) {
    return notFound("Product not found");
  }

  const feed = await getProductReviewFeed(product.id, 10);

  return ok({
    data: feed.reviews,
    meta: feed.summary,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const limited = rateLimitOrResponse(request, {
    id: "product-reviews:post",
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const user = await requireCustomerUser();

  if (!user) {
    return unauthorized("Please sign in to submit a review");
  }

  const { id } = await context.params;
  const product = await findProductByIdOrSlug(id);

  if (!product) {
    return notFound("Product not found");
  }

  let body: ReviewBody;

  try {
    body = (await request.json()) as ReviewBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const rating = normalizeRating(body.rating);
  const title = normalizeOptionalText(body.title, 80);
  const comment = normalizeRequiredText(body.comment, 20, 1200);

  if (!rating) {
    return badRequest("Rating must be between 1 and 5");
  }

  if (!comment) {
    return badRequest("Review text must be between 20 and 1200 characters");
  }

  const verifiedPurchase = await isVerifiedPurchase(product.id, user.id);
  const review = await createOrUpdateReview({
    productId: product.id,
    userId: user.id,
    rating,
    title,
    comment,
    verifiedPurchase,
  });

  return ok(
    {
      message: "Review submitted successfully",
      data: review,
    },
    { status: 201 },
  );
}

type ReviewBody = {
  rating?: unknown;
  title?: unknown;
  comment?: unknown;
};

function normalizeRating(value: unknown) {
  const rating = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return rating;
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  if (!text) {
    return null;
  }

  return text.slice(0, maxLength);
}

function normalizeRequiredText(value: unknown, minLength: number, maxLength: number) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  if (text.length < minLength) {
    return null;
  }

  return text.slice(0, maxLength);
}
