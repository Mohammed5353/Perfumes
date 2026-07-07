import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  collections,
  productCollections,
  products,
  productTagValues,
  type ProductTag,
} from "@/lib/db/schema";

export type ProductSort = "newest" | "price_asc" | "price_desc" | "name_asc";

export type ProductQuery = {
  category?: string | null;
  collection?: string | null;
  search?: string | null;
  tag?: string | null;
  bestSeller?: string | null;
  featured?: string | null;
  sort?: string | null;
  page?: string | null;
  limit?: string | null;
};

type ProductRow = typeof products.$inferSelect;
type CategoryRow = typeof categories.$inferSelect;
type CollectionRow = typeof collections.$inferSelect;

type ProductWithRelations = ProductRow & {
  category: CategoryRow;
  collections: CollectionRow[];
};

export async function getProducts(query: ProductQuery) {
  const page = parsePositiveInt(query.page, 1);
  const limit = Math.min(parsePositiveInt(query.limit, 12), 50);
  const sort = normalizeSort(query.sort);
  const where = await buildProductWhere(query);

  const [items, totalResult] = await Promise.all([
    db
      .select({
        product: products,
        category: categories,
      })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(where)
      .orderBy(getProductOrderBy(sort))
      .offset((page - 1) * limit)
      .limit(limit),
    db.select({ value: count() }).from(products).where(where),
  ]);

  const productIds = items.map((item) => item.product.id);
  const collectionRows =
    productIds.length > 0
      ? await db
          .select({
            productId: productCollections.productId,
            collection: collections,
          })
          .from(productCollections)
          .innerJoin(collections, eq(productCollections.collectionId, collections.id))
          .where(inArray(productCollections.productId, productIds))
          .orderBy(asc(collections.displayOrder), asc(collections.name))
      : [];
  const collectionsByProduct = groupCollectionsByProduct(collectionRows);
  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    data: items.map((item) =>
      serializeProduct({
        ...item.product,
        category: item.category,
        collections: collectionsByProduct.get(item.product.id) ?? [],
      }),
    ),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

export async function findProductByIdOrSlug(idOrSlug: string) {
  const normalized = idOrSlug.trim();
  const legacyModelNo = numericToLegacyModelNo(normalized);
  const productIdentifier = isUuid(idOrSlug)
    ? or(eq(products.id, idOrSlug), eq(products.slug, idOrSlug))
    : or(
        eq(products.slug, idOrSlug),
        eq(products.seoUrl, idOrSlug),
        eq(products.seoUrl, `/products/${idOrSlug}`),
        ...(legacyModelNo ? [eq(products.modelNo, legacyModelNo)] : []),
      );
  const [row] = await db
    .select({
      product: products,
      category: categories,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.isActive, true),
        productIdentifier,
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const collectionRows = await db
    .select({
      collection: collections,
    })
    .from(productCollections)
    .innerJoin(collections, eq(productCollections.collectionId, collections.id))
    .where(eq(productCollections.productId, row.product.id))
    .orderBy(asc(collections.displayOrder), asc(collections.name));

  return serializeProduct({
    ...row.product,
    category: row.category,
    collections: collectionRows.map((item) => item.collection),
  });
}

export async function getProductVariants(parentProductId: string) {
  const rows = await db
    .select({
      id: products.id,
      parentProductId: products.parentProductId,
      name: products.name,
      modelNo: products.modelNo,
      image: products.image,
      price: products.price,
      stock: products.stock,
      isActive: products.isActive,
    })
    .from(products)
    .where(and(eq(products.parentProductId, parentProductId), eq(products.isActive, true)))
    .orderBy(asc(products.name));

  return rows.map((row) => ({
    id: row.id,
    parentProductId: row.parentProductId,
    name: row.name,
    modelNo: row.modelNo,
    image: row.image,
    price: Number(row.price),
    stock: row.stock,
    isActive: row.isActive,
  }));
}

export async function getRelatedProducts(input: {
  productId: string;
  categoryId: string;
  notes: string[];
  tag: ProductTag | null;
  collectionIds: string[];
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 3, 1), 6);
  const notes = input.notes.map((note) => note.trim()).filter(Boolean);
  const noteSet = new Set(notes.map((note) => note.toLowerCase()));
  const collectionIdSet = new Set(input.collectionIds);

  const primaryCandidates = await db
    .select({
      product: products,
      category: categories,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.isActive, true),
        sql`${products.parentProductId} is null`,
        eq(products.categoryId, input.categoryId),
        sql`${products.id} <> ${input.productId}`,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(60);

  const fallbackCandidates =
    primaryCandidates.length >= limit
      ? []
      : await db
          .select({
            product: products,
            category: categories,
          })
          .from(products)
          .innerJoin(categories, eq(products.categoryId, categories.id))
          .where(
            and(
              eq(products.isActive, true),
              sql`${products.parentProductId} is null`,
              sql`${products.id} <> ${input.productId}`,
              sql`${products.categoryId} <> ${input.categoryId}`,
            ),
          )
          .orderBy(desc(products.createdAt))
          .limit(60);

  const candidates = [...primaryCandidates, ...fallbackCandidates];
  const productIds = candidates.map((item) => item.product.id);

  const collectionRows =
    productIds.length > 0
      ? await db
          .select({
            productId: productCollections.productId,
            collection: collections,
          })
          .from(productCollections)
          .innerJoin(collections, eq(productCollections.collectionId, collections.id))
          .where(inArray(productCollections.productId, productIds))
          .orderBy(asc(collections.displayOrder), asc(collections.name))
      : [];
  const collectionsByProduct = groupCollectionsByProduct(collectionRows);

  const scored = candidates.map((item) => {
    const candidateCollections = collectionsByProduct.get(item.product.id) ?? [];
    const candidateCollectionOverlap = candidateCollections.reduce(
      (count, row) => count + (collectionIdSet.has(row.id) ? 1 : 0),
      0,
    );
    const candidateNotes = item.product.notes ?? [];
    const noteOverlap = candidateNotes.reduce(
      (count, note) => count + (noteSet.has(String(note).toLowerCase()) ? 1 : 0),
      0,
    );
    const tagScore = input.tag && item.product.tag === input.tag ? 5 : 0;
    const bestSellerScore = item.product.isBestSeller ? 1 : 0;
    const featuredScore = item.product.isFeatured ? 1 : 0;
    const collectionScore = Math.min(candidateCollectionOverlap, 3) * 3;
    const noteScore = Math.min(noteOverlap, 4) * 2;

    return {
      score: tagScore + bestSellerScore + featuredScore + collectionScore + noteScore,
      createdAt: item.product.createdAt,
      product: serializeProduct({
        ...item.product,
        category: item.category,
        collections: candidateCollections,
      }),
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return scored.slice(0, limit).map((row) => row.product);
}

export async function getCategories() {
  const items = await db.select().from(categories).orderBy(asc(categories.name));

  return {
    data: items.map(serializeCategory),
    meta: {
      total: items.length,
    },
  };
}

export async function findCategoryBySlug(slug: string) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  return category ? serializeCategory(category) : null;
}

export async function getCollections() {
  const items = await db
    .select()
    .from(collections)
    .orderBy(asc(collections.displayOrder), asc(collections.name));

  return {
    data: items.map(serializeCollection),
    meta: {
      total: items.length,
    },
  };
}

export async function getBrands() {
  const items = await db
    .select({
      name: products.brand,
      total: count(),
    })
    .from(products)
    .where(and(eq(products.isActive, true), sql`${products.parentProductId} is null`))
    .groupBy(products.brand)
    .orderBy(asc(products.brand));

  return {
    data: items.map((item) => ({
      name: item.name,
      total: item.total,
    })),
    meta: {
      total: items.length,
    },
  };
}

export async function findCollectionBySlug(slug: string) {
  const collection = await db.query.collections.findFirst({
    where: eq(collections.slug, slug),
  });

  return collection ? serializeCollection(collection) : null;
}

async function buildProductWhere(query: ProductQuery) {
  const filters: SQL[] = [eq(products.isActive, true), sql`${products.parentProductId} is null`];

  if (query.category && query.category !== "all") {
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, query.category),
      columns: { id: true },
    });

    filters.push(category ? eq(products.categoryId, category.id) : sql`false`);
  }

  if (query.collection && query.collection !== "all") {
    const collection = await db.query.collections.findFirst({
      where: eq(collections.slug, query.collection),
      columns: { id: true },
    });

    if (!collection) {
      filters.push(sql`false`);
    } else {
      filters.push(
        sql`exists (
          select 1
          from ${productCollections}
          where ${productCollections.productId} = ${products.id}
          and ${productCollections.collectionId} = ${collection.id}
        )`,
      );
    }
  }

  const tag = normalizeTag(query.tag);

  if (tag) {
    filters.push(eq(products.tag, tag));
  }

  if (query.bestSeller === "true") {
    filters.push(eq(products.isBestSeller, true));
  }

  if (query.featured === "true") {
    filters.push(eq(products.isFeatured, true));
  }

  if (query.search) {
    const search = query.search.trim();

    if (search) {
      filters.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.brand, `%${search}%`),
          ilike(products.modelNo, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.seoTitle, `%${search}%`),
          ilike(products.seoDescription, `%${search}%`),
          sql`${products.notes} @> ARRAY[${search}]::text[]`,
        )!,
      );
    }
  }

  return and(...filters);
}

function getProductOrderBy(sort: ProductSort) {
  if (sort === "price_asc") {
    return asc(products.price);
  }

  if (sort === "price_desc") {
    return desc(products.price);
  }

  if (sort === "name_asc") {
    return asc(products.name);
  }

  return desc(products.createdAt);
}

function normalizeSort(sort?: string | null): ProductSort {
  if (
    sort === "price_asc" ||
    sort === "price_desc" ||
    sort === "name_asc" ||
    sort === "newest"
  ) {
    return sort;
  }

  return "newest";
}

function normalizeTag(tag?: string | null) {
  if (!tag) {
    return null;
  }

  const normalized = tag.toUpperCase() as ProductTag;

  if (productTagValues.includes(normalized)) {
    return normalized;
  }

  return null;
}

function groupCollectionsByProduct(
  rows: Array<{ productId: string; collection: CollectionRow }>,
) {
  const map = new Map<string, CollectionRow[]>();

  for (const row of rows) {
    const existing = map.get(row.productId) ?? [];
    existing.push(row.collection);
    map.set(row.productId, existing);
  }

  return map;
}

function serializeProduct(product: ProductWithRelations) {
  return {
    id: product.id,
    modelNo: product.modelNo,
    slug: product.slug,
    image: product.image,
    name: product.name,
    description: product.description,
    detailedDescription: product.detailedDescription,
    productDetailHtml: product.productDetailHtml,
    seoUrl: product.seoUrl,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    seoKeywords: product.seoKeywords,
    googleShoppingDescription: product.googleShoppingDescription,
    notes: product.notes,
    scentOptions: product.scentOptions,
    price: Number(product.price),
    tag: product.tag,
    category: product.category.slug,
    categoryDetails: serializeCategory(product.category),
    collections: product.collections.map((item: { slug: string }) => item.slug),
    collectionDetails: product.collections.map(serializeCollection),
    stock: product.stock,
    isBestSeller: product.isBestSeller,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function serializeCategory(category: CategoryRow) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function serializeCollection(collection: CollectionRow) {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    image: collection.image,
    images: collection.images,
    countLabel: collection.countLabel,
    displayOrder: collection.displayOrder,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

function parsePositiveInt(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function numericToLegacyModelNo(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 999) {
    return null;
  }

  return `SCT-${String(numberValue).padStart(3, "0")}`;
}
