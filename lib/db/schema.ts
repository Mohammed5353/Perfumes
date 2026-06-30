import { relations, sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { orderStatusValues } from "@/lib/order-status";

export { orderStatusValues } from "@/lib/order-status";

export const roleValues = ["USER", "ADMIN"] as const;
export const productTagValues = ["HOT", "NEW", "POPULAR", "LUXURY"] as const;
export const paymentStatusValues = [
  "PENDING",
  "SUCCESS",
  "FAILED",
  "REFUNDED",
] as const;

export type Role = (typeof roleValues)[number];
export type ProductTag = (typeof productTagValues)[number];
export type OrderStatus = (typeof orderStatusValues)[number];
export type PaymentStatus = (typeof paymentStatusValues)[number];

export const roleEnum = pgEnum("role", roleValues);
export const productTagEnum = pgEnum("product_tag", productTagValues);
export const orderStatusEnum = pgEnum("order_status", orderStatusValues);
export const paymentStatusEnum = pgEnum("payment_status", paymentStatusValues);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    role: roleEnum("role").notNull().default("USER"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    verificationOtpHash: text("verification_otp_hash"),
    verificationOtpExpiresAt: timestamp("verification_otp_expires_at", { withTimezone: true }),
    passwordResetOtpHash: text("password_reset_otp_hash"),
    passwordResetOtpExpiresAt: timestamp("password_reset_otp_expires_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_sessions_token_hash_unique").on(table.tokenHash),
    index("user_sessions_user_id_idx").on(table.userId),
    index("user_sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("categories_slug_unique").on(table.slug)],
);

export const collections = pgTable(
  "collections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    image: text("image"),
    imagePublicId: text("image_public_id"),
    images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
    countLabel: text("count_label"),
    displayOrder: integer("display_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("collections_slug_unique").on(table.slug),
    index("collections_display_order_idx").on(table.displayOrder),
  ],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelNo: text("model_no").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    detailedDescription: text("detailed_description"),
    productDetailHtml: text("product_detail_html"),
    seoUrl: text("seo_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords").array().notNull().default(sql`ARRAY[]::text[]`),
    googleShoppingDescription: text("google_shopping_description"),
    image: text("image").notNull(),
    imagePublicId: text("image_public_id"),
    purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").notNull().default(0),
    brand: text("brand").notNull().default("Scentora"),
    tag: productTagEnum("tag"),
    notes: text("notes").array().notNull().default(sql`ARRAY[]::text[]`),
    scentOptions: text("scent_options").array().notNull().default(sql`ARRAY[]::text[]`),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    parentProductId: uuid("parent_product_id"),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("products_model_no_unique").on(table.modelNo),
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_category_id_idx").on(table.categoryId),
    index("products_is_active_idx").on(table.isActive),
    index("products_parent_product_id_idx").on(table.parentProductId),
    foreignKey({
      columns: [table.parentProductId],
      foreignColumns: [table.id],
      name: "products_parent_product_id_products_id_fk",
    }).onDelete("set null"),
    index("products_is_best_seller_idx").on(table.isBestSeller),
    index("products_is_featured_idx").on(table.isFeatured),
  ],
);

export const productCollections = pgTable(
  "product_collections",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.collectionId] }),
    index("product_collections_collection_id_idx").on(table.collectionId),
  ],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    scentOption: text("scent_option").notNull().default(""),
    quantity: integer("quantity").notNull().default(1),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("cart_items_user_product_scent_unique").on(
      table.userId,
      table.productId,
      table.scentOption,
    ),
    index("cart_items_product_id_idx").on(table.productId),
  ],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("wishlist_items_user_product_unique").on(
      table.userId,
      table.productId,
    ),
    index("wishlist_items_product_id_idx").on(table.productId),
  ],
);

export const productReviews = pgTable(
  "product_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    comment: text("comment").notNull(),
    verifiedPurchase: boolean("verified_purchase").notNull().default(false),
    isApproved: boolean("is_approved").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("product_reviews_product_user_unique").on(table.productId, table.userId),
    index("product_reviews_product_id_idx").on(table.productId),
    index("product_reviews_user_id_idx").on(table.userId),
    index("product_reviews_is_approved_idx").on(table.isApproved),
    index("product_reviews_created_at_idx").on(table.createdAt),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    shippingAddress: jsonb("shipping_address").notNull(),
    paymentMethod: text("payment_method").notNull().default("CASH_ON_DELIVERY"),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    shippingFee: numeric("shipping_fee", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: orderStatusEnum("status").notNull().default("PENDING"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("PENDING"),
    ...timestamps,
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_idx").on(table.status),
    index("orders_payment_status_idx").on(table.paymentStatus),
    index("orders_customer_email_idx").on(table.customerEmail),
  ],
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull(),
    note: text("note"),
    changedByAdminId: uuid("changed_by_admin_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("order_status_history_order_id_idx").on(table.orderId),
    index("order_status_history_status_idx").on(table.status),
    index("order_status_history_created_at_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    name: text("name").notNull(),
    image: text("image").notNull(),
    scentOption: text("scent_option").notNull().default(""),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_product_id_idx").on(table.productId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerOrderId: text("provider_order_id"),
    providerPaymentId: text("provider_payment_id"),
    providerSignature: text("provider_signature"),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    rawPayload: jsonb("raw_payload"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("payments_order_id_unique").on(table.orderId),
    index("payments_provider_idx").on(table.provider),
    index("payments_provider_order_id_idx").on(table.providerOrderId),
    index("payments_provider_payment_id_idx").on(table.providerPaymentId),
    index("payments_status_idx").on(table.status),
  ],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("newsletter_subscribers_email_unique").on(table.email)],
);

export const contactInquiries = pgTable(
  "contact_inquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("contact_inquiries_email_idx").on(table.email),
    index("contact_inquiries_created_at_idx").on(table.createdAt),
  ],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  ...timestamps,
});

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    description: text("description"),
    discountType: text("discount_type").notNull().default("PERCENT"),
    discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
    maxDiscountAmount: numeric("max_discount_amount", { precision: 10, scale: 2 }),
    minOrderAmount: numeric("min_order_amount", { precision: 10, scale: 2 }).notNull().default("0"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("coupons_code_unique").on(table.code), index("coupons_is_active_idx").on(table.isActive)],
);

export const userCoupons = pgTable(
  "user_coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    couponId: uuid("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(true),
    usedAt: timestamp("used_at", { withTimezone: true }),
    usedOrderId: uuid("used_order_id").references(() => orders.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_coupons_user_coupon_unique").on(table.userId, table.couponId),
    index("user_coupons_user_id_idx").on(table.userId),
    index("user_coupons_coupon_id_idx").on(table.couponId),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  productReviews: many(productReviews),
  orders: many(orders),
  sessions: many(userSessions),
  coupons: many(userCoupons),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  collections: many(productCollections),
  cartItems: many(cartItems),
  wishlistItems: many(wishlistItems),
  orderItems: many(orderItems),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(productCollections),
}));

export const productCollectionsRelations = relations(
  productCollections,
  ({ one }) => ({
    product: one(products, {
      fields: [productCollections.productId],
      references: [products.id],
    }),
    collection: one(collections, {
      fields: [productCollections.collectionId],
      references: [collections.id],
    }),
  }),
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  payment: one(payments),
  userCoupons: many(userCoupons),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  userCoupons: many(userCoupons),
}));

export const userCouponsRelations = relations(userCoupons, ({ one }) => ({
  user: one(users, {
    fields: [userCoupons.userId],
    references: [users.id],
  }),
  coupon: one(coupons, {
    fields: [userCoupons.couponId],
    references: [coupons.id],
  }),
  order: one(orders, {
    fields: [userCoupons.usedOrderId],
    references: [orders.id],
  }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  changedByAdmin: one(users, {
    fields: [orderStatusHistory.changedByAdminId],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
