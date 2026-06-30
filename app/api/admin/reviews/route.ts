import { badRequest, ok } from "@/lib/api/http";
import { secureAdminApi } from "@/lib/api/secure";
import { deleteReviewById, getAdminReviews } from "@/lib/api/reviews";

export async function GET(request: Request) {
  const secured = await secureAdminApi(request, { id: "admin-reviews:get" });
  if (secured) return secured;

  const reviews = await getAdminReviews();

  return ok({
    data: reviews,
    meta: {
      total: reviews.length,
    },
  });
}

export async function DELETE(request: Request) {
  const secured = await secureAdminApi(request, { id: "admin-reviews:delete" });
  if (secured) return secured;

  let body: { reviewId?: unknown };

  try {
    body = (await request.json()) as { reviewId?: unknown };
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (typeof body.reviewId !== "string" || !body.reviewId.trim()) {
    return badRequest("reviewId is required");
  }

  await deleteReviewById(body.reviewId.trim());

  return ok({
    message: "Review deleted",
  });
}
