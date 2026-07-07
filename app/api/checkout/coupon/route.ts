import { and, eq, isNull } from "drizzle-orm";
import { badRequest, ok } from "@/lib/api/http";
import { formatKwd } from "@/lib/currency";
import { db } from "@/lib/db";
import { userCoupons, users } from "@/lib/db/schema";
import { requireCustomerUser } from "@/lib/user-auth";

type Body = {
  code?: unknown;
  subtotal?: unknown;
  email?: unknown;
};

export async function POST(request: Request) {
  const user = await requireCustomerUser();
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const subtotal = typeof body.subtotal === "number" ? body.subtotal : Number(body.subtotal);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
    return badRequest("code and subtotal are required");
  }

  const targetUserId = user?.id
    ? user.id
    : (
        await db.query.users.findFirst({
          where: and(eq(users.email, email), eq(users.role, "USER")),
          columns: { id: true },
        })
      )?.id;

  if (!targetUserId) {
    return badRequest("Coupon is only available for a registered user");
  }

  const assignment = await db.query.userCoupons.findFirst({
    where: and(
      eq(userCoupons.userId, targetUserId),
      eq(userCoupons.isActive, true),
      isNull(userCoupons.usedAt),
    ),
    with: {
      coupon: true,
    },
  });

  const coupon =
    assignment && !Array.isArray(assignment.coupon) ? assignment.coupon : null;

  if (!assignment || !coupon || coupon.code !== code || !coupon.isActive) {
    return badRequest("Invalid coupon code for this user");
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return badRequest("Coupon is not active yet");
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return badRequest("Coupon has expired");
  }

  const minOrderAmount = Number(coupon.minOrderAmount);
  if (subtotal < minOrderAmount) {
    return badRequest(`Minimum order amount is ${formatKwd(minOrderAmount)}`);
  }

  const discountValue = Number(coupon.discountValue);
  let discountAmount =
    coupon.discountType === "PERCENT"
      ? (subtotal * discountValue) / 100
      : discountValue;
  if (coupon.maxDiscountAmount !== null) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return ok({
    data: {
      code,
      discountAmount,
      finalSubtotal: subtotal - discountAmount,
    },
  });
}
