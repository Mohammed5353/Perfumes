import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { badRequest } from "@/lib/api/http";
import { db } from "@/lib/db";
import {
  cartItems,
  coupons,
  orderItems,
  orderStatusHistory,
  orders,
  products,
  userCoupons,
  users,
} from "@/lib/db/schema";
import { City, Country, State } from "country-state-city";
import { isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { isPostalCodeValid } from "@/lib/postal-code";
import { requireCustomerUser } from "@/lib/user-auth";
import { buildInvoiceHtml } from "@/lib/invoice";
import { formatKwd } from "@/lib/currency";
import {
  sendAdminOrderEmail,
  sendInvoiceEmail,
  sendOrderStatusEmail,
} from "@/lib/email";
import { buildTrackingNumber, defaultCourierName } from "@/lib/delivery-tracking";
import { sendAdminOrderWhatsApp, sendOrderStatusSms } from "@/lib/sms";

type CheckoutBody = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  dialCode?: unknown;
  phone?: unknown;
  addressLine1?: unknown;
  addressLine2?: unknown;
  city?: unknown;
  countryCode?: unknown;
  state?: unknown;
  stateCode?: unknown;
  postalCode?: unknown;
  country?: unknown;
  guestItems?: unknown;
  couponCode?: unknown;
};

export async function POST(request: Request) {
  try {
    return await createOrder(request);
  } catch (error) {
    console.error("Checkout failed", error);
    return NextResponse.json(
      { error: "Unable to place order. Please try again." },
      { status: 500 },
    );
  }
}

async function createOrder(request: Request) {
  const user = await requireCustomerUser();

  let body: CheckoutBody;

  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const firstName = readString(body.firstName);
  const lastName = readString(body.lastName);
  const email = user?.email ?? readString(body.email).toLowerCase();
  const dialCode = readString(body.dialCode) || "+91";
  const phone = readString(body.phone);
  const addressLine1 = readString(body.addressLine1);
  const addressLine2 = readString(body.addressLine2);
  const city = readString(body.city);
  const countryCode = readString(body.countryCode) || "IN";
  const stateCode = readString(body.stateCode);
  const countryRecord = Country.getCountryByCode(countryCode);
  const stateRecord = stateCode
    ? State.getStateByCodeAndCountry(stateCode, countryCode)
    : undefined;
  const state = stateRecord?.name ?? readString(body.state);
  const postalCode = readString(body.postalCode);
  const country = countryRecord?.name ?? (readString(body.country) || "India");
  const couponCode = readString(body.couponCode).toUpperCase();
  const cityRecords = stateCode ? City.getCitiesOfState(countryCode, stateCode) : [];
  const validCity =
    cityRecords.length === 0 || cityRecords.some((option) => option.name === city);
  const expectedDialCode = countryRecord?.phonecode
    ? `+${countryRecord.phonecode}`
    : dialCode;

  if (
    !firstName ||
    !lastName ||
    !dialCode ||
    !email ||
    !phone ||
    !countryCode ||
    !stateCode ||
    !addressLine1 ||
    !city ||
    !postalCode
  ) {
    return badRequest(
      "First name, last name, email, phone number, country, state, city, address line 1, and zip/postal code are required",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("A valid email is required");
  }

  if (!countryRecord) {
    return badRequest("Please select a valid country");
  }

  if (!stateRecord) {
    return badRequest("Please select a valid state");
  }

  if (!validCity) {
    return badRequest("Please select a valid city");
  }

  if (!isPostalCodeValid(countryCode, postalCode)) {
    return badRequest(`Postal code is not valid for ${country}`);
  }

  const fullPhone = `${dialCode || expectedDialCode} ${phone}`;

  if (!isValidPhoneNumber(fullPhone, countryCode as CountryCode)) {
    return badRequest(`Mobile number is not valid for ${country}`);
  }

  const cartRows = user
    ? await db
        .select({
          productId: products.id,
          name: products.name,
          image: products.image,
          price: products.price,
          quantity: cartItems.quantity,
          scentOption: cartItems.scentOption,
        })
        .from(cartItems)
        .innerJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, user.id))
    : await getGuestCartRows(body.guestItems);

  if (cartRows.length === 0) {
    return badRequest("Your cart is empty");
  }

  const subtotal = cartRows.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const shippingFee = 0;
  const couponResult =
    couponCode.length > 0
      ? await validateCouponForOrder({
          userId: user?.id ?? null,
          email,
          couponCode,
          subtotal,
        })
      : null;
  if (couponCode && !couponResult) {
    return badRequest("Invalid coupon code");
  }
  const discountAmount = couponResult?.discountAmount ?? 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const order = await db.transaction(async (tx) => {
    const [createdOrder] = await tx
      .insert(orders)
      .values({
        userId: user?.id,
        customerEmail: email,
        customerName: `${firstName} ${lastName}`,
        customerPhone: fullPhone,
        paymentMethod: "CASH_ON_DELIVERY",
        shippingAddress: {
          firstName,
          lastName,
          dialCode: dialCode || expectedDialCode,
          phone,
          fullPhone,
          countryCode,
          stateCode,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country,
        },
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: "PENDING",
        paymentStatus: "PENDING",
      })
      .returning({ id: orders.id });

    await tx
      .update(orders)
      .set({
        courierName: defaultCourierName,
        trackingNumber: buildTrackingNumber(createdOrder.id),
        codAmountDue: totalAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, createdOrder.id));

    await tx.insert(orderItems).values(
      cartRows.map((item) => ({
        orderId: createdOrder.id,
        productId: item.productId,
        name: item.name,
        image: item.image,
        scentOption: item.scentOption,
        price: item.price,
        quantity: item.quantity,
      })),
    );

    await tx.insert(orderStatusHistory).values({
      orderId: createdOrder.id,
      status: "PENDING",
      note: couponCode
        ? `Order placed by customer (coupon: ${couponCode}, discount: ${discountAmount.toFixed(2)})`
        : "Order placed by customer",
    });

    if (couponResult) {
      await tx
        .update(userCoupons)
        .set({
          isActive: false,
          usedAt: new Date(),
          usedOrderId: createdOrder.id,
          updatedAt: new Date(),
        })
        .where(eq(userCoupons.id, couponResult.userCouponId));
      await tx
        .update(coupons)
        .set({
          redemptionCount: couponResult.redemptionCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, couponResult.couponId));
    }

    if (user) {
      await tx.delete(cartItems).where(eq(cartItems.userId, user.id));
    }

    return createdOrder;
  });

  // Best effort notifications. Do not block checkout on email/SMS/WhatsApp failure.
  try {
    const html = buildInvoiceHtml({
      orderId: order.id,
      createdAt: new Date(),
      customerEmail: email,
      customerName: `${firstName} ${lastName}`,
      customerPhone: fullPhone,
      paymentMethod: "CASH_ON_DELIVERY",
      subtotal,
      shippingFee,
      totalAmount,
      shippingAddress: {
        firstName,
        lastName,
        dialCode: dialCode || expectedDialCode,
        phone,
        fullPhone,
        countryCode,
        stateCode,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country,
      },
      items: cartRows.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: Number(item.price),
        scentOption: item.scentOption || null,
      })),
    });

    await sendInvoiceEmail({
      to: email,
      customerName: `${firstName} ${lastName}`,
      orderId: order.id,
      html,
    });
  } catch (invoiceError) {
    console.error("Invoice email failed", invoiceError);
  }

  const orderNotification = {
    orderId: order.id,
    customerName: `${firstName} ${lastName}`,
    customerEmail: email,
    customerPhone: fullPhone,
    totalAmount,
    status: "PENDING",
    paymentMethod: "CASH_ON_DELIVERY",
    subtotal,
    shippingFee,
    discountAmount,
    shippingAddress: {
      firstName,
      lastName,
      fullPhone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
    },
    items: cartRows.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      scentOption: item.scentOption || null,
    })),
  };

  const notificationResults = await Promise.allSettled([
    sendOrderStatusEmail({
      to: email,
      customerName: `${firstName} ${lastName}`,
      orderId: order.id,
      status: "PENDING",
      note: `Your cash on delivery order has been placed. Total ${formatKwd(totalAmount)}.`,
    }),
    sendOrderStatusSms({
      to: fullPhone,
      orderId: order.id,
      status: "PENDING",
      note: `Your cash on delivery order has been placed. Total ${formatKwd(totalAmount)}.`,
    }),
    sendAdminOrderEmail(orderNotification),
    sendAdminOrderWhatsApp(orderNotification),
  ]);

  const failedNotifications = notificationResults.filter(
    (result) => result.status === "rejected",
  );

  if (failedNotifications.length > 0) {
    console.error("Checkout notification failed", {
      orderId: order.id,
      failures: failedNotifications.map((result) =>
        result.status === "rejected" && result.reason instanceof Error
          ? result.reason.message
          : "Unknown notification error",
      ),
    });
  }

  return NextResponse.json({
    message: "Order created successfully",
    data: {
      orderId: order.id,
      discountAmount,
      couponCode: couponResult ? couponCode : null,
    },
  });
}

async function validateCouponForOrder({
  userId,
  email,
  couponCode,
  subtotal,
}: {
  userId: string | null;
  email: string;
  couponCode: string;
  subtotal: number;
}) {
  const targetUserId =
    userId ??
    (
      await db.query.users.findFirst({
        where: and(eq(users.email, email), eq(users.role, "USER")),
        columns: { id: true },
      })
    )?.id;
  if (!targetUserId) return null;

  const assignment = await db.query.userCoupons.findFirst({
    where: and(
      eq(userCoupons.userId, targetUserId),
      eq(userCoupons.isActive, true),
      isNull(userCoupons.usedAt),
    ),
    with: { coupon: true },
  });
  if (!assignment) return null;
  const coupon =
    assignment && !Array.isArray(assignment.coupon) ? assignment.coupon : null;
  if (!coupon || coupon.code !== couponCode || !coupon.isActive) return null;

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) return null;
  if (coupon.expiresAt && coupon.expiresAt < now) return null;
  if (
    coupon.maxRedemptions !== null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    return null;
  }

  const minOrderAmount = Number(coupon.minOrderAmount);
  if (subtotal < minOrderAmount) return null;

  const value = Number(coupon.discountValue);
  let discountAmount =
    coupon.discountType === "PERCENT" ? (subtotal * value) / 100 : value;
  if (coupon.maxDiscountAmount !== null) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    userCouponId: assignment.id,
    couponId: coupon.id,
    redemptionCount: coupon.redemptionCount,
    discountAmount,
  };
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getGuestCartRows(value: unknown) {
  const items = Array.isArray(value)
    ? value
        .map((item) => ({
          productId:
            item && typeof item === "object" && "productId" in item
              ? readString(item.productId)
              : "",
          quantity:
            item && typeof item === "object" && "quantity" in item
              ? normalizeQuantity(item.quantity)
              : 1,
          scentOption:
            item && typeof item === "object" && "scentOption" in item
              ? readString(item.scentOption)
              : "",
        }))
        .filter((item) => item.productId)
    : [];

  if (items.length === 0) {
    return [];
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      image: products.image,
      price: products.price,
    })
    .from(products)
    .where(and(eq(products.isActive, true), inArray(products.id, productIds)));
  const productById = new Map(rows.map((row) => [row.productId, row]));

  return items.flatMap((item) => {
    const row = productById.get(item.productId);

    if (!row) {
      return [];
    }

    return {
      ...row,
      quantity: item.quantity,
      scentOption: item.scentOption,
    };
  });
}

function normalizeQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return 1;
  }

  return Math.min(quantity, 99);
}
