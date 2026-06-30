"use client";

import {
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Mail,
  Menu,
  MessageSquareText,
  Package,
  PlusCircle,
  RefreshCcw,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Trophy,
  Upload,
  Users,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/api/uploads";
import {
  formatOrderStatus,
  getOrderStatusTone,
  isActiveOrderStatus,
  orderStatusValues,
} from "@/lib/order-status";

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN";
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Collection = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
};

type Product = {
  id: string;
  modelNo: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  detailedDescription: string | null;
  productDetailHtml: string | null;
  seoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  googleShoppingDescription: string | null;
  parentProductId: string | null;
  purchasePrice: number;
  price: number;
  stock: number;
  tag: string | null;
  notes: string[];
  scentOptions: string[];
  isActive: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  collections?: Collection[];
  createdAt: string;
};

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  scentOption: string | null;
};

type Order = {
  id: string;
  customerEmail: string;
  customerName: string | null;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  statusHistory: Array<{
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
  items: OrderItem[];
};

type AdminCartItem = {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  scentOption: string | null;
  addedAt: string;
  updatedAt: string;
};

type AdminCart = {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: AdminCartItem[];
  totalQuantity: number;
  subtotal: number;
  lastUpdatedAt: string;
};

type ContactInquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  createdAt: string;
};

type NewsletterSubscriber = {
  id: string;
  email: string;
  createdAt: string;
};

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  verifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  product: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
};

type SiteSettings = {
  promoBannerText: string;
  facebookUrl: string;
  xUrl: string;
  youtubeUrl: string;
  instagramUrl: string;
  contactPhone: string;
  contactEmail: string;
};

type BestSellerAdminProduct = {
  id: string;
  modelNo: string;
  name: string;
  slug: string;
  image: string;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  metrics: {
    productId: string;
    monthlySold: number;
    trendingSold: number;
    totalSold: number;
  };
};

type BestSellerSettings = {
  mode: "auto" | "manual";
  products: BestSellerAdminProduct[];
};

type AdminCustomer = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  cartItemCount: number;
  cartQuantity: number;
  lastCartUpdatedAt: string | null;
  activeSessionCount: number;
  lastSeenAt: string | null;
};

type CouponAssignment = {
  userCouponId: string;
  user: { id: string; email: string; name: string | null };
  coupon: {
    id: string;
    code: string;
    description: string | null;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    startsAt: string | null;
    expiresAt: string | null;
  };
  assignmentActive: boolean;
  usedAt: string | null;
  createdAt: string;
};

type ProductForm = {
  modelNo: string;
  name: string;
  slug: string;
  description: string;
  detailedDescription: string;
  productDetailHtml: string;
  seoUrl: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  googleShoppingDescription: string;
  image: string;
  imagePublicId: string;
  purchasePrice: string;
  price: string;
  stock: string;
  tag: string;
  notes: string;
  scentOptions: string;
  categoryId: string;
  collectionIds: string[];
  parentProductId: string;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
};

type NavId =
  | "overview"
  | "create"
  | "products"
  | "collections"
  | "orders"
  | "carts"
  | "reviews"
  | "messages"
  | "newsletter"
  | "users"
  | "coupons"
  | "settings"
  | "best-sellers";

const navItems: Array<{ id: NavId; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "coupons", label: "Coupons", icon: DollarSign },
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Products", icon: Package },
  { id: "collections", label: "Collections", icon: ListOrdered },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "carts", label: "Carts", icon: ShoppingBag },
  { id: "best-sellers", label: "Best Sellers", icon: Trophy },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "messages", label: "Messages", icon: MessageSquareText },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "settings", label: "Settings", icon: Settings },
];

const paymentStatuses = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"] as const;
const productTags = ["", "HOT", "NEW", "POPULAR", "LUXURY"] as const;

const emptyProductForm: ProductForm = {
  modelNo: "",
  name: "",
  slug: "",
  description: "",
  detailedDescription: "",
  productDetailHtml: "",
  seoUrl: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  googleShoppingDescription: "",
  image: "",
  imagePublicId: "",
  purchasePrice: "",
  price: "",
  stock: "",
  tag: "",
  notes: "",
  scentOptions: "Amber, Vanilla, Sandalwood",
  categoryId: "",
  collectionIds: [],
  parentProductId: "",
  isBestSeller: false,
  isFeatured: false,
  isActive: true,
};

const defaultSiteSettings: SiteSettings = {
  promoBannerText:
    "Free Shipping on Orders over 30KWD - Arrives Next Day From 5 to 9 PM",
  facebookUrl: "",
  xUrl: "",
  youtubeUrl: "",
  instagramUrl: "",
  contactPhone: "+96500000000",
  contactEmail: "support@scentora.com",
};

const defaultBestSellerSettings: BestSellerSettings = {
  mode: "auto",
  products: [],
};

export default function AdminDashboard({ admin }: { admin: AdminUser }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<NavId>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [carts, setCarts] = useState<AdminCart[]>([]);
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<
    NewsletterSubscriber[]
  >([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [siteSettings, setSiteSettings] =
    useState<SiteSettings>(defaultSiteSettings);
  const [bestSellerSettings, setBestSellerSettings] =
    useState<BestSellerSettings>(defaultBestSellerSettings);
  const [usersList, setUsersList] = useState<AdminCustomer[]>([]);
  const [coupons, setCoupons] = useState<CouponAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [updatingCollectionId, setUpdatingCollectionId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingBestSellers, setSavingBestSellers] = useState(false);
  const [evaluatingBestSellers, setEvaluatingBestSellers] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [importingProducts, setImportingProducts] = useState(false);

  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);

  const [orderFilters, setOrderFilters] = useState({
    q: "",
    status: "",
    paymentStatus: "",
  });

  const orderQuery = useMemo(() => {
    const params = new URLSearchParams({ page: "1", limit: "50" });

    if (orderFilters.q.trim()) {
      params.set("q", orderFilters.q.trim());
    }

    if (orderFilters.status) {
      params.set("status", orderFilters.status);
    }

    if (orderFilters.paymentStatus) {
      params.set("paymentStatus", orderFilters.paymentStatus);
    }

    return params.toString();
  }, [orderFilters]);

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.isActive).length;
    const lowStockProducts = products.filter((product) => product.stock <= 5).length;
    const pendingOrders = orders.filter((order) =>
      isActiveOrderStatus(order.status),
    ).length;
    const orderValue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const openCarts = carts.length;
    const messages = contactInquiries.length;
    const subscribers = newsletterSubscribers.length;
    const reviewsCount = reviews.length;
    const averageReviewRating =
      reviewsCount > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewsCount
        : 0;
    const usersCount = usersList.length;

    return {
      usersCount,
      totalProducts: products.length,
      activeProducts,
      lowStockProducts,
      pendingOrders,
      orderValue,
      openCarts,
      messages,
      subscribers,
      reviewsCount,
      averageReviewRating,
    };
  }, [carts, contactInquiries, newsletterSubscribers, orders, products, reviews, usersList]);

  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.modelNo, product.slug, product.category.name, product.tag ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [productSearch, products]);

  const selectedNavItem = navItems.find((item) => item.id === activeView) ?? navItems[0];

  const handleUnauthorized = useCallback(() => {
    router.replace("/admin/login");
    router.refresh();
  }, [router]);

  const readAdminJson = useCallback(
    async <T,>(response: Response, fallbackMessage: string) => {
      const body = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<T>)
        | null;

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Admin login required");
      }

      if (!response.ok || body?.error) {
        throw new Error(body?.error ?? fallbackMessage);
      }

      return body as T;
    },
    [handleUnauthorized],
  );

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoriesRes, collectionsRes, productsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/collections"),
        fetch("/api/admin/products"),
      ]);

      const categoriesJson = await readAdminJson<{ data: Category[] }>(
        categoriesRes,
        "Failed to load categories",
      );
      const collectionsJson = await readAdminJson<{ data: Collection[] }>(
        collectionsRes,
        "Failed to load collections",
      );
      const productsJson = await readAdminJson<{ data: Product[] }>(
        productsRes,
        "Failed to load products",
      );

      setCategories(categoriesJson.data);
      setCollections(collectionsJson.data);
      setProducts(productsJson.data);
      setProductForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || categoriesJson.data[0]?.id || "",
      }));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load admin dashboard data",
      );
    } finally {
      setLoading(false);
    }
  }, [readAdminJson]);

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/orders?${orderQuery}`);
      const json = await readAdminJson<{ data: Order[] }>(
        response,
        "Failed to load orders",
      );
      setOrders(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load orders");
    }
  }, [orderQuery, readAdminJson]);

  const loadCarts = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/carts");
      const json = await readAdminJson<{ data: AdminCart[] }>(
        response,
        "Failed to load carts",
      );
      setCarts(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load carts");
    }
  }, [readAdminJson]);

  const loadContactInquiries = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/contact-inquiries");
      const json = await readAdminJson<{ data: ContactInquiry[] }>(
        response,
        "Failed to load contact messages",
      );
      setContactInquiries(json.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load contact messages",
      );
    }
  }, [readAdminJson]);

  const loadNewsletterSubscribers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/newsletter-subscribers");
      const json = await readAdminJson<{ data: NewsletterSubscriber[] }>(
        response,
        "Failed to load newsletter subscribers",
      );
      setNewsletterSubscribers(json.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load newsletter subscribers",
      );
    }
  }, [readAdminJson]);

  const loadReviews = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/reviews");
      const json = await readAdminJson<{ data: Review[] }>(
        response,
        "Failed to load reviews",
      );
      setReviews(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load reviews");
    }
  }, [readAdminJson]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users");
      const json = await readAdminJson<{ data: AdminCustomer[] }>(
        response,
        "Failed to load users",
      );
      setUsersList(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users");
    }
  }, [readAdminJson]);

  const loadCoupons = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/coupons");
      const json = await readAdminJson<{ data: CouponAssignment[] }>(
        response,
        "Failed to load coupons",
      );
      setCoupons(json.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load coupons");
    }
  }, [readAdminJson]);

  const loadSiteSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/site-settings");
      const json = await readAdminJson<{ data: SiteSettings }>(
        response,
        "Failed to load site settings",
      );
      setSiteSettings(json.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load site settings",
      );
    }
  }, [readAdminJson]);

  const loadBestSellerSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/best-sellers");
      const json = await readAdminJson<{ data: BestSellerSettings }>(
        response,
        "Failed to load best seller settings",
      );
      setBestSellerSettings(json.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load best seller settings",
      );
    }
  }, [readAdminJson]);

  useEffect(() => {
    void Promise.resolve().then(loadInitialData);
  }, [loadInitialData]);

  useEffect(() => {
    void Promise.resolve().then(loadOrders);
  }, [loadOrders]);

  useEffect(() => {
    void Promise.resolve().then(loadCarts);
  }, [loadCarts]);

  useEffect(() => {
    void Promise.resolve().then(loadContactInquiries);
  }, [loadContactInquiries]);

  useEffect(() => {
    void Promise.resolve().then(loadNewsletterSubscribers);
  }, [loadNewsletterSubscribers]);

  useEffect(() => {
    void Promise.resolve().then(loadReviews);
  }, [loadReviews]);

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, [loadUsers]);

  useEffect(() => {
    void Promise.resolve().then(loadCoupons);
  }, [loadCoupons]);

  useEffect(() => {
    void Promise.resolve().then(loadSiteSettings);
  }, [loadSiteSettings]);

  useEffect(() => {
    void Promise.resolve().then(loadBestSellerSettings);
  }, [loadBestSellerSettings]);

  async function onCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProduct(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          parentProductId: productForm.parentProductId || null,
          scentOptions: productForm.scentOptions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          notes: productForm.notes
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          seoKeywords: productForm.seoKeywords
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          price: Number(productForm.price),
          purchasePrice: Number(productForm.purchasePrice || 0),
          stock: Number(productForm.stock),
          tag: productForm.tag || null,
        }),
      });
      const body = await readAdminJson<{ data: Product; message: string }>(
        response,
        "Failed to create product",
      );

      setProducts((prev) => [body.data, ...prev].slice(0, 100));
      setProductForm((prev) => ({
        ...emptyProductForm,
        categoryId: prev.categoryId,
      }));
      setActiveView("products");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create product",
      );
    } finally {
      setSavingProduct(false);
    }
  }

  async function onUploadProductImage(file: File) {
    setUploadingImage(true);
    setError(null);

    try {
      const signatureResponse = await fetch("/api/admin/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "scentora/products" }),
      });
      const signatureJson = await readAdminJson<{
        data: {
          cloudName: string;
          apiKey: string;
          folder: string;
          timestamp: number;
          signature: string;
        };
      }>(signatureResponse, "Failed to generate upload signature");

      const uploaded = await uploadImageToCloudinary(file, signatureJson.data);
      setProductForm((prev) => ({
        ...prev,
        image: uploaded.secure_url,
        imagePublicId: uploaded.public_id,
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Failed to upload image",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  async function onUpdateOrder(
    orderId: string,
    payload: { status?: string; paymentStatus?: string },
  ) {
    setUpdatingOrderId(orderId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readAdminJson<{ data: Order; message: string }>(
        response,
        "Failed to update order",
      );

      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? body.data : order)),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Failed to update order",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  async function onUpdateCollectionOrder(collectionId: string, displayOrder: number) {
    setUpdatingCollectionId(collectionId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/collections/${collectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayOrder }),
      });
      const body = await readAdminJson<{ data: Collection; message: string }>(
        response,
        "Failed to update collection order",
      );

      setCollections((prev) =>
        prev
          .map((collection) =>
            collection.id === collectionId ? body.data : collection,
          )
          .sort((left, right) =>
            left.displayOrder === right.displayOrder
              ? left.name.localeCompare(right.name)
              : left.displayOrder - right.displayOrder,
          ),
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update collection order",
      );
    } finally {
      setUpdatingCollectionId(null);
    }
  }

  async function onSaveSiteSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteSettings),
      });
      const body = await readAdminJson<{ data: SiteSettings; message: string }>(
        response,
        "Failed to save site settings",
      );

      setSiteSettings(body.data);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save site settings",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function onEvaluateBestSellers() {
    setEvaluatingBestSellers(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/best-sellers", { method: "POST" });
      const body = await readAdminJson<{
        data: BestSellerSettings;
        message: string;
      }>(response, "Failed to evaluate best sellers");

      setBestSellerSettings(body.data);
      await loadInitialData();
    } catch (evaluateError) {
      setError(
        evaluateError instanceof Error
          ? evaluateError.message
          : "Failed to evaluate best sellers",
      );
    } finally {
      setEvaluatingBestSellers(false);
    }
  }

  async function onSaveBestSellers(nextSettings: BestSellerSettings) {
    setSavingBestSellers(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/best-sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          nextSettings.mode === "auto"
            ? { mode: "auto" }
            : {
                mode: "manual",
                bestSellerIds: nextSettings.products
                  .filter((product) => product.isBestSeller)
                  .map((product) => product.id),
                trendingIds: nextSettings.products
                  .filter((product) => product.isFeatured)
                  .map((product) => product.id),
              },
        ),
      });
      const body = await readAdminJson<{
        data: BestSellerSettings;
        message: string;
      }>(response, "Failed to save best seller settings");

      setBestSellerSettings(body.data);
      await loadInitialData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save best seller settings",
      );
    } finally {
      setSavingBestSellers(false);
    }
  }

  async function onDeleteReview(reviewId: string) {
    setDeletingReviewId(reviewId);
    setError(null);

    try {
      const response = await fetch("/api/admin/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const body = await readAdminJson<{ message: string }>(
        response,
        "Failed to delete review",
      );

      if (!body.message) {
        throw new Error("Failed to delete review");
      }

      await loadReviews();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete review",
      );
    } finally {
      setDeletingReviewId(null);
    }
  }

  async function onLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function viewUserOrders(user: AdminCustomer) {
    setOrderFilters({
      q: user.email,
      status: "",
      paymentStatus: "",
    });
    setActiveView("orders");
  }

  function renderActiveView() {
    if (loading) {
      return <LoadingPanel />;
    }

    if (activeView === "create") {
      return (
        <CreateProductView
          categories={categories}
          collections={collections}
          products={products}
          form={productForm}
          savingProduct={savingProduct}
          uploadingImage={uploadingImage}
          onChange={setProductForm}
          onCreateProduct={onCreateProduct}
          onUploadProductImage={onUploadProductImage}
        />
      );
    }

    if (activeView === "products") {
      return (
        <ProductsView
          products={visibleProducts}
          query={productSearch}
          onQueryChange={setProductSearch}
          importingProducts={importingProducts}
          onReload={loadInitialData}
          onError={setError}
          onImportProducts={async (file) => {
            setImportingProducts(true);
            setError(null);
            try {
              const formData = new FormData();
              formData.append("file", file);
              const response = await fetch("/api/admin/products/import", {
                method: "POST",
                body: formData,
              });
              const body = (await response.json().catch(() => null)) as
                | { error?: string; data?: { importedCount?: number; errors?: string[] } }
                | null;
              if (!response.ok || body?.error) {
                throw new Error(body?.error ?? "Failed to import products");
              }
              await loadInitialData();
              if (body?.data?.errors && body.data.errors.length > 0) {
                setError(`Imported ${body.data.importedCount ?? 0}. Some rows failed: ${body.data.errors.slice(0, 5).join(" | ")}`);
              }
            } catch (importError) {
              setError(importError instanceof Error ? importError.message : "Failed to import products");
            } finally {
              setImportingProducts(false);
            }
          }}
        />
      );
    }

    if (activeView === "collections") {
      return (
        <CollectionsView
          collections={collections}
          updatingCollectionId={updatingCollectionId}
          onUpdateCollectionOrder={onUpdateCollectionOrder}
        />
      );
    }

    if (activeView === "orders") {
      return (
        <OrdersView
          filters={orderFilters}
          orders={orders}
          updatingOrderId={updatingOrderId}
          onFiltersChange={setOrderFilters}
          onUpdateOrder={onUpdateOrder}
          onError={setError}
        />
      );
    }

    if (activeView === "carts") {
      return <CartsView carts={carts} />;
    }

    if (activeView === "best-sellers") {
      return (
        <BestSellerView
          settings={bestSellerSettings}
          saving={savingBestSellers}
          evaluating={evaluatingBestSellers}
          onChange={setBestSellerSettings}
          onSave={onSaveBestSellers}
          onEvaluate={onEvaluateBestSellers}
        />
      );
    }

    if (activeView === "reviews") {
      return (
        <ReviewsView
          reviews={reviews}
          deletingReviewId={deletingReviewId}
          onDeleteReview={onDeleteReview}
          onReload={loadReviews}
        />
      );
    }

    if (activeView === "messages") {
      return <ContactInquiriesView inquiries={contactInquiries} />;
    }

    if (activeView === "newsletter") {
      return <NewsletterSubscribersView subscribers={newsletterSubscribers} />;
    }

    if (activeView === "users") {
      return <UsersView users={usersList} onViewOrders={viewUserOrders} />;
    }

    if (activeView === "coupons") {
      return (
        <CouponsView
          users={usersList}
          coupons={coupons}
          onReload={loadCoupons}
          onError={setError}
        />
      );
    }

    if (activeView === "settings") {
      return (
        <SettingsView
          settings={siteSettings}
          savingSettings={savingSettings}
          onChange={setSiteSettings}
          onSave={onSaveSiteSettings}
        />
      );
    }

    return (
      <OverviewView
        carts={carts}
        orders={orders}
        products={products}
        users={usersList}
        stats={stats}
        onChangeView={setActiveView}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-950 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      {mobileSidebarOpen ? (
        <button
          type="button"
          aria-label="Close admin sidebar"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <AdminSidebar
        activeView={activeView}
        admin={admin}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onLogout={onLogout}
        onSelect={(id) => {
          setActiveView(id);
          setMobileSidebarOpen(false);
        }}
      />

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open admin sidebar"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Admin
                </p>
                <h1 className="truncate font-heading text-2xl font-semibold">
                  {selectedNavItem.label}
                </h1>
              </div>
            </div>

            <button
              type="button"
              title="Refresh dashboard data"
              aria-label="Refresh dashboard data"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                void loadInitialData();
                void loadOrders();
                void loadCarts();
                void loadContactInquiries();
                void loadNewsletterSubscribers();
                void loadUsers();
              }}
            >
              <RefreshCcw className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
          {error ? (
            <section className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{error}</p>
            </section>
          ) : null}

          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}

function AdminSidebar({
  activeView,
  admin,
  mobileOpen,
  onClose,
  onLogout,
  onSelect,
}: {
  activeView: NavId;
  admin: AdminUser;
  mobileOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onSelect: (id: NavId) => void;
}) {
  const initials =
    admin.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SA";

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-[280px] flex-col border-r border-white/10 bg-[#111827] text-white shadow-xl transition-transform lg:sticky lg:top-0 lg:z-auto lg:flex lg:h-screen lg:translate-x-0 lg:shadow-none ${
        mobileOpen ? "flex translate-x-0" : "hidden -translate-x-full"
      }`}
    >
      <div className="flex min-h-16 items-center justify-between border-b border-white/10 px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Scentora
          </p>
          <p className="font-heading text-2xl font-semibold">Admin</p>
        </div>
        <button
          type="button"
          aria-label="Close admin sidebar"
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300 lg:hidden"
          onClick={onClose}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeView === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => onSelect(item.id)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/8 p-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-sm font-bold text-slate-950">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {admin.name || "Scentora Admin"}
            </p>
            <p className="truncate text-xs text-slate-400">{admin.email}</p>
          </div>
        </div>
        <button
          type="button"
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-semibold text-slate-200 hover:bg-white/10"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function OverviewView({
  carts,
  orders,
  products,
  users,
  stats,
  onChangeView,
}: {
  carts: AdminCart[];
  orders: Order[];
  products: Product[];
  users: AdminCustomer[];
  stats: {
    usersCount: number;
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    pendingOrders: number;
    orderValue: number;
    openCarts: number;
    subscribers: number;
    reviewsCount: number;
    averageReviewRating: number;
  };
  onChangeView: (id: NavId) => void;
}) {
  const lowStockProducts = products.filter((product) => product.stock <= 5).slice(0, 6);
  const recentOrders = orders.slice(0, 6);
  const recentUsers = users.slice(0, 6);
  const orderStatusCounts = orderStatusValues.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
  const maxOrderStatusCount = Math.max(
    ...orderStatusCounts.map((item) => item.count),
    1,
  );
  const inventoryHealth =
    stats.totalProducts > 0
      ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
      : 0;
  const cartConversionSignal =
    stats.openCarts > 0
      ? Math.round((stats.pendingOrders / stats.openCarts) * 100)
      : stats.pendingOrders > 0
        ? 100
        : 0;
  const topProducts = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.55fr)]">
        <article className="overflow-hidden rounded-lg border border-slate-800 bg-[#07111f] text-white shadow-sm">
          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                  Live overview
                </span>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {stats.pendingOrders} pending orders
                </span>
              </div>
              <h2 className="font-heading text-4xl font-semibold leading-tight">
                Scentora performance dashboard
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Track catalog health, order movement, customer activity, and open
                carts from one control surface.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HeroMetric
                  label="Order value"
                  value={formatInr(stats.orderValue)}
                  icon={DollarSign}
                />
                <HeroMetric
                  label="Active catalog"
                  value={`${inventoryHealth}%`}
                  icon={CheckCircle2}
                />
                <HeroMetric
                  label="Cart signal"
                  value={`${cartConversionSignal}%`}
                  icon={ShoppingBag}
                />
                <HeroMetric
                  label="Average rating"
                  value={`${stats.averageReviewRating.toFixed(1)}★`}
                  icon={Star}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative min-h-[280px] overflow-hidden rounded-lg border border-cyan-300/20 bg-slate-900/70 p-5">
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.14)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                      Live insights map
                    </p>
                    <p className="mt-1 text-lg font-semibold">Store network</p>
                  </div>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                    Synced
                  </span>
                </div>
                <div className="relative mt-8 h-44">
                  <div className="absolute left-[12%] top-[12%] h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.9)]" />
                  <div className="absolute left-[44%] top-[34%] h-4 w-4 rounded-full bg-emerald-300 shadow-[0_0_28px_rgba(110,231,183,0.9)]" />
                  <div className="absolute right-[16%] top-[8%] h-3 w-3 rounded-full bg-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.9)]" />
                  <div className="absolute bottom-[14%] left-[25%] h-3 w-3 rounded-full bg-violet-300 shadow-[0_0_24px_rgba(196,181,253,0.9)]" />
                  <div className="absolute bottom-[22%] right-[10%] h-4 w-4 rounded-full bg-rose-300 shadow-[0_0_28px_rgba(253,164,175,0.9)]" />
                  <div className="absolute left-[14%] top-[17%] h-px w-[33%] rotate-[18deg] bg-cyan-200/40" />
                  <div className="absolute left-[47%] top-[40%] h-px w-[34%] -rotate-[28deg] bg-emerald-200/40" />
                  <div className="absolute bottom-[30%] left-[29%] h-px w-[30%] -rotate-[18deg] bg-violet-200/40" />
                  <div className="absolute bottom-[31%] right-[13%] h-px w-[29%] rotate-[15deg] bg-rose-200/40" />
                  <div className="absolute left-1/2 top-1/2 grid h-24 w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cyan-200/20 bg-cyan-300/10 text-center shadow-[0_0_60px_rgba(34,211,238,0.18)]">
                    <div>
                      <p className="text-2xl font-semibold">{orders.length}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100">
                        Orders
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/8 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Order pipeline
                    </p>
                    <p className="mt-1 text-lg font-semibold">Fulfillment flow</p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                </div>
                <div className="space-y-3">
                  {orderStatusCounts
                    .filter((item) => item.count > 0)
                    .slice(0, 5)
                    .map((item) => (
                      <div key={item.status}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{item.status}</span>
                          <span className="text-slate-400">{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-300"
                            style={{
                              width: `${Math.max(
                                8,
                                (item.count / maxOrderStatusCount) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  {orders.length === 0 ? (
                    <p className="rounded-lg bg-white/8 p-3 text-sm text-slate-300">
                      No order data yet.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Intelligence feed
            </p>
            <h2 className="font-heading text-2xl font-semibold">Live signals</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "Pending fulfillment",
                value: stats.pendingOrders,
                tone: "bg-amber-50 text-amber-700",
              },
              {
                label: "Open carts",
                value: stats.openCarts,
                tone: "bg-blue-50 text-blue-700",
              },
              {
                label: "Registered users",
                value: stats.usersCount,
                tone: "bg-emerald-50 text-emerald-700",
              },
              {
                label: "Reviews",
                value: `${stats.reviewsCount}`,
                tone: "bg-amber-50 text-amber-700",
              },
              {
                label: "Low stock alerts",
                value: stats.lowStockProducts,
                tone: "bg-rose-50 text-rose-700",
              },
            ].map((signal) => (
              <div
                key={signal.label}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg text-sm font-semibold ${signal.tone}`}>
                    {signal.value}
                  </span>
                  <p className="text-sm font-semibold">{signal.label}</p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Stock map
              </p>
              <h2 className="font-heading text-2xl font-semibold">Product capacity</h2>
            </div>
            <button
              type="button"
              onClick={() => onChangeView("products")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View products
            </button>
          </div>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              {topProducts.map((product) => {
                const maxStock = Math.max(...topProducts.map((item) => item.stock), 1);

                return (
                  <div key={product.id}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-semibold">{product.name}</span>
                      <span className="text-slate-500">{product.stock} units</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-950"
                        style={{
                          width: `${Math.max(6, (product.stock / maxStock) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {topProducts.length === 0 ? <EmptyState title="No products found" /> : null}
            </div>
            <div className="grid content-center gap-3 rounded-lg bg-slate-50 p-4">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full border-[10px] border-slate-200 border-t-slate-950">
                <span className="text-2xl font-semibold">{inventoryHealth}%</span>
              </div>
              <p className="text-center text-sm font-semibold text-slate-600">
                Active catalog health
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            eyebrow="Inventory"
            title="Low stock products"
            actionLabel="View products"
            onAction={() => onChangeView("products")}
          />
          {lowStockProducts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.category.name}</p>
                  </div>
                  <StatusPill
                    label={`${product.stock} left`}
                    tone={product.stock === 0 ? "danger" : "warning"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No low stock products" />
          )}
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            eyebrow="Users"
            title="Recent accounts"
            actionLabel="View users"
            onAction={() => onChangeView("users")}
          />
          {recentUsers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {user.name || "Unnamed user"}
                    </p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <StatusPill
                    label={user.emailVerifiedAt ? "VERIFIED" : "UNVERIFIED"}
                    tone={user.emailVerifiedAt ? "green" : "warning"}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No users found" />
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <PanelHeader
            eyebrow="Orders"
            title="Recent activity"
            actionLabel="View orders"
            onAction={() => onChangeView("orders")}
          />
          {recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {order.customerName || order.customerEmail}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(order.createdAt)} · {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatInr(order.totalAmount)}</p>
                    <StatusPill
                      label={formatOrderStatus(order.status)}
                      tone={getOrderStatusTone(order.status)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No orders loaded" />
          )}
        </article>

      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <PanelHeader
          eyebrow="Customer carts"
          title="Recent cart activity"
          actionLabel="View carts"
          onAction={() => onChangeView("carts")}
        />
        {carts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {carts.slice(0, 6).map((cart) => (
              <div
                key={cart.user.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {cart.user.name || cart.user.email}
                  </p>
                  <p className="text-xs text-slate-500">
                    {cart.totalQuantity} items · {formatDate(cart.lastUpdatedAt)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatInr(cart.subtotal)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No customer carts yet" />
        )}
      </section>
    </div>
  );
}

function CreateProductView({
  categories,
  collections,
  products,
  form,
  savingProduct,
  uploadingImage,
  onChange,
  onCreateProduct,
  onUploadProductImage,
}: {
  categories: Category[];
  collections: Collection[];
  products: Product[];
  form: ProductForm;
  savingProduct: boolean;
  uploadingImage: boolean;
  onChange: Dispatch<SetStateAction<ProductForm>>;
  onCreateProduct: (event: FormEvent<HTMLFormElement>) => void;
  onUploadProductImage: (file: File) => void;
}) {
  const parentProducts = products.filter((product) => !product.parentProductId);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <article className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Catalog
            </p>
            <h2 className="font-heading text-3xl font-semibold">Create product</h2>
          </div>
          <StatusPill label={form.isActive ? "Active" : "Draft"} tone="neutral" />
        </div>

        <form onSubmit={onCreateProduct} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Name"
              value={form.name}
              onChange={(value) => onChange((prev) => ({ ...prev, name: value }))}
              required
            />
            <InputField
              label="Model no"
              value={form.modelNo}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, modelNo: value.toUpperCase() }))
              }
              placeholder="Auto-generated when blank"
            />
            <InputField
              label="Slug"
              value={form.slug}
              onChange={(value) => onChange((prev) => ({ ...prev, slug: value }))}
              placeholder="Auto-generated when blank"
            />
            <TextAreaField
              label="Short description"
              value={form.description}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, description: value }))
              }
              className="md:col-span-2"
              required
            />
            <TextAreaField
              label="Detailed description"
              value={form.detailedDescription}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, detailedDescription: value }))
              }
              className="md:col-span-2"
              placeholder="Write 5-6 lines for the product detail page."
            />
            <InputField
              label="SEO URL"
              value={form.seoUrl}
              onChange={(value) => onChange((prev) => ({ ...prev, seoUrl: value }))}
              className="md:col-span-2"
              placeholder="/products/noir-mystique"
            />
            <InputField
              label="Page title"
              value={form.seoTitle}
              onChange={(value) => onChange((prev) => ({ ...prev, seoTitle: value }))}
              className="md:col-span-2"
              placeholder="Noir Mystique Perfume | Scentora"
            />
            <TextAreaField
              label="Meta description"
              value={form.seoDescription}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, seoDescription: value }))
              }
              className="md:col-span-2"
              placeholder="Search result description for this product."
            />
            <InputField
              label="Meta keywords"
              value={form.seoKeywords}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, seoKeywords: value }))
              }
              className="md:col-span-2"
              placeholder="Noir Mystique, oud perfume, amber fragrance"
            />
            <TextAreaField
              label="Google Shopping description"
              value={form.googleShoppingDescription}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, googleShoppingDescription: value }))
              }
              className="md:col-span-2"
              placeholder="Product-feed friendly description for Google Shopping."
            />
            <TextAreaField
              label="Professional detail HTML"
              value={form.productDetailHtml}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, productDetailHtml: value }))
              }
              className="md:col-span-2"
              placeholder="<p><b>Features</b></p><ul><li>Long-lasting amber warmth</li><li>Smooth vanilla finish</li></ul>"
            />
            <InputField
              label="Image URL"
              value={form.image}
              onChange={(value) => onChange((prev) => ({ ...prev, image: value }))}
              className="md:col-span-2"
              required
            />
            <InputField
              label="Cloudinary public id"
              value={form.imagePublicId}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, imagePublicId: value }))
              }
            />
            <InputField
              label="Notes"
              value={form.notes}
              onChange={(value) => onChange((prev) => ({ ...prev, notes: value }))}
              placeholder="Rose, Vanilla, Musk"
            />
            <InputField
              label="Smell options"
              value={form.scentOptions}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, scentOptions: value }))
              }
              placeholder="Amber, Vanilla, Sandalwood"
            />
            <InputField
              label="Purchase price"
              type="number"
              value={form.purchasePrice}
              min="0"
              step="0.01"
              onChange={(value) =>
                onChange((prev) => ({ ...prev, purchasePrice: value }))
              }
              placeholder="Only visible in admin"
            />
            <InputField
              label="Selling price"
              type="number"
              value={form.price}
              min="0"
              step="0.01"
              onChange={(value) => onChange((prev) => ({ ...prev, price: value }))}
              required
            />
            <InputField
              label="Stock"
              type="number"
              value={form.stock}
              min="0"
              step="1"
              onChange={(value) => onChange((prev) => ({ ...prev, stock: value }))}
              required
            />
            <SelectField
              label="Category"
              value={form.categoryId}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, categoryId: value }))
              }
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Parent product (for smell variant)"
              value={form.parentProductId}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, parentProductId: value }))
              }
            >
              <option value="">None (create parent product)</option>
              {parentProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.modelNo})
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Tag"
              value={form.tag}
              onChange={(value) => onChange((prev) => ({ ...prev, tag: value }))}
            >
              {productTags.map((tag) => (
                <option key={tag || "none"} value={tag}>
                  {tag || "No tag"}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <label
              htmlFor="collectionIds"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Collections
            </label>
            <select
              id="collectionIds"
              multiple
              className="min-h-32 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              value={form.collectionIds}
              onChange={(event) =>
                onChange((prev) => ({
                  ...prev,
                  collectionIds: Array.from(event.target.selectedOptions).map(
                    (option) => option.value,
                  ),
                }))
              }
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <ToggleField
              label="Best seller"
              checked={form.isBestSeller}
              onChange={(checked) =>
                onChange((prev) => ({ ...prev, isBestSeller: checked }))
              }
            />
            <ToggleField
              label="Featured"
              checked={form.isFeatured}
              onChange={(checked) =>
                onChange((prev) => ({ ...prev, isFeatured: checked }))
              }
            />
            <ToggleField
              label="Active"
              checked={form.isActive}
              onChange={(checked) =>
                onChange((prev) => ({ ...prev, isActive: checked }))
              }
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <label
              className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${
                uploadingImage ? "pointer-events-none opacity-60" : ""
              }`}
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {uploadingImage ? "Uploading..." : "Upload image"}
              <input
                type="file"
                accept="image/*"
                disabled={uploadingImage}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    onUploadProductImage(file);
                  }
                }}
              />
            </label>

            <button
              type="submit"
              disabled={savingProduct || uploadingImage}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              {savingProduct ? "Creating..." : "Create product"}
            </button>
          </div>
        </form>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Media
        </p>
        <h2 className="mb-4 font-heading text-3xl font-semibold">Preview</h2>
        {form.image ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- Admin product images can be local paths or runtime Cloudinary URLs. */}
            <img
              src={form.image}
              alt="Product preview"
              className="aspect-[4/5] w-full rounded-lg border border-slate-200 object-cover"
            />
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p className="break-all">URL: {form.image}</p>
              <p className="mt-1 break-all">
                Public ID: {form.imagePublicId || "N/A"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid aspect-[4/5] place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            No image selected
          </div>
        )}
      </article>
    </section>
  );
}

function ProductsView({
  products,
  query,
  onQueryChange,
  importingProducts,
  onImportProducts,
  onReload,
  onError,
}: {
  products: Product[];
  query: string;
  onQueryChange: (value: string) => void;
  importingProducts: boolean;
  onImportProducts: (file: File) => void;
  onReload: () => Promise<void>;
  onError: Dispatch<SetStateAction<string | null>>;
}) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    modelNo: "",
    image: "",
    price: "",
    stock: "",
  });

  const childCountByParentId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      if (product.parentProductId) {
        map.set(product.parentProductId, (map.get(product.parentProductId) ?? 0) + 1);
      }
    }
    return map;
  }, [products]);

  async function onEdit(product: Product) {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      modelNo: product.modelNo,
      image: product.image,
      price: String(product.price),
      stock: String(product.stock),
    });
  }

  async function onSubmitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;
    setUpdatingId(editingProduct.id);
    onError(null);
    try {
      const response = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          modelNo: editForm.modelNo,
          image: editForm.image,
          price: Number(editForm.price),
          stock: Number(editForm.stock),
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok || body?.error) throw new Error(body?.error ?? "Failed to update product");
      await onReload();
      setEditingProduct(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to update product");
    } finally {
      setUpdatingId(null);
    }
  }

  async function onSoftDelete(product: Product) {
    if (!window.confirm(`Soft delete ${product.name}?`)) return;
    setUpdatingId(product.id);
    onError(null);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok || body?.error) throw new Error(body?.error ?? "Failed to delete product");
      await onReload();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to delete product");
    } finally {
      setUpdatingId(null);
    }
  }

  async function onGenerateVariants(product: Product) {
    if (product.parentProductId) return;

    onError(null);
    setUpdatingId(product.id);

    try {
      const response = await fetch(`/api/admin/products/${product.id}/generate-variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok || body?.error) {
        throw new Error(body?.error ?? "Failed to generate variants");
      }

      await onReload();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to generate variants");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Inventory
          </p>
          <h2 className="font-heading text-3xl font-semibold">Products</h2>
        </div>
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder="Search products"
        />
        <label
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${importingProducts ? "pointer-events-none opacity-60" : ""}`}
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {importingProducts ? "Importing..." : "Import CSV / Excel"}
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            className="sr-only"
            disabled={importingProducts}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImportProducts(file);
              }
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      {products.length > 0 ? (
        <div className="max-h-[calc(100vh-220px)] overflow-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Model no</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Purchase</th>
                <th className="px-5 py-3 font-semibold">Selling</th>
                <th className="px-5 py-3 font-semibold">Stock</th>
                <th className="px-5 py-3 font-semibold">Tags</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Admin product images can be local paths or runtime Cloudinary URLs. */}
                      <img
                        src={product.image}
                        alt=""
                        className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-slate-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
                    {product.modelNo}
                  </td>
                  <td className="px-5 py-3">{product.category.name}</td>
                  <td className="px-5 py-3 font-medium text-slate-500">
                    {formatInr(product.purchasePrice)}
                  </td>
                  <td className="px-5 py-3 font-semibold">{formatInr(product.price)}</td>
                  <td className="px-5 py-3">
                    <StatusPill
                      label={String(product.stock)}
                      tone={product.stock <= 5 ? "warning" : "neutral"}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {product.tag ? (
                        <StatusPill label={product.tag} tone="accent" />
                      ) : null}
                      {product.isBestSeller ? (
                        <StatusPill label="BEST" tone="blue" />
                      ) : null}
                      {product.isFeatured ? (
                        <StatusPill label="FEATURED" tone="green" />
                      ) : null}
                      {!product.tag && !product.isBestSeller && !product.isFeatured ? (
                        <span className="text-xs text-slate-400">None</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill
                      label={product.isActive ? "ACTIVE" : "INACTIVE"}
                      tone={product.isActive ? "green" : "neutral"}
                    />
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {!product.parentProductId &&
                      (childCountByParentId.get(product.id) ?? 0) === 0 &&
                      product.scentOptions.length > 0 ? (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                          disabled={updatingId === product.id}
                          onClick={() => {
                            void onGenerateVariants(product);
                          }}
                          title="Create child smell variants from scent options"
                        >
                          Generate smells
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                        disabled={updatingId === product.id}
                        onClick={() => {
                          void onEdit(product);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                        disabled={updatingId === product.id}
                        onClick={() => {
                          void onSoftDelete(product);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No products found" />
      )}

      {editingProduct ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-heading text-2xl font-semibold">Edit product</h3>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
                onClick={() => setEditingProduct(null)}
              >
                Close
              </button>
            </div>
            <form onSubmit={onSubmitEdit} className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Name"
                value={editForm.name}
                onChange={(value) => setEditForm((prev) => ({ ...prev, name: value }))}
                className="md:col-span-2"
                required
              />
              <InputField
                label="Model no"
                value={editForm.modelNo}
                onChange={(value) =>
                  setEditForm((prev) => ({ ...prev, modelNo: value.toUpperCase() }))
                }
                required
              />
              <InputField
                label="Image URL"
                value={editForm.image}
                onChange={(value) => setEditForm((prev) => ({ ...prev, image: value }))}
                required
              />
              <InputField
                label="Selling price"
                type="number"
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={(value) => setEditForm((prev) => ({ ...prev, price: value }))}
                required
              />
              <InputField
                label="Stock"
                type="number"
                min="0"
                step="1"
                value={editForm.stock}
                onChange={(value) => setEditForm((prev) => ({ ...prev, stock: value }))}
                required
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
                  onClick={() => setEditingProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === editingProduct.id}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {updatingId === editingProduct.id ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CollectionsView({
  collections,
  updatingCollectionId,
  onUpdateCollectionOrder,
}: {
  collections: Collection[];
  updatingCollectionId: string | null;
  onUpdateCollectionOrder: (collectionId: string, displayOrder: number) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Merchandising
        </p>
        <h2 className="font-heading text-3xl font-semibold">Collection order</h2>
      </div>

      {collections.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="grid gap-4 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_180px]"
            >
              <div className="min-w-0">
                <p className="font-semibold">{collection.name}</p>
                <p className="text-sm text-slate-500">/{collection.slug}</p>
              </div>
              <InputField
                label={`${collection.name} order`}
                type="number"
                min="0"
                step="1"
                value={String(collection.displayOrder)}
                onChange={(value) => {
                  const displayOrder = Number(value);

                  if (Number.isInteger(displayOrder) && displayOrder >= 0) {
                    onUpdateCollectionOrder(collection.id, displayOrder);
                  }
                }}
                disabled={updatingCollectionId === collection.id}
                hideLabel
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No collections found" />
      )}
    </section>
  );
}

function OrdersView({
  filters,
  orders,
  updatingOrderId,
  onFiltersChange,
  onUpdateOrder,
  onError,
}: {
  filters: {
    q: string;
    status: string;
    paymentStatus: string;
  };
  orders: Order[];
  updatingOrderId: string | null;
  onFiltersChange: Dispatch<
    SetStateAction<{
      q: string;
      status: string;
      paymentStatus: string;
    }>
  >;
  onUpdateOrder: (
    orderId: string,
    payload: { status?: string; paymentStatus?: string },
  ) => void;
  onError: Dispatch<SetStateAction<string | null>>;
}) {
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  async function sendInvoice(orderId: string) {
    setSendingInvoiceId(orderId);
    onError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok || body?.error) {
        throw new Error(body?.error ?? "Failed to send invoice");
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to send invoice");
    } finally {
      setSendingInvoiceId(null);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Fulfillment
          </p>
          <h2 className="font-heading text-3xl font-semibold">Orders</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <SearchInput
            value={filters.q}
            onChange={(value) => onFiltersChange((prev) => ({ ...prev, q: value }))}
            placeholder="Search order, email, or customer"
          />
          <SelectField
            label="Order status"
            hideLabel
            value={filters.status}
            onChange={(value) =>
              onFiltersChange((prev) => ({ ...prev, status: value }))
            }
          >
            <option value="">All order statuses</option>
            {orderStatusValues.map((status) => (
              <option key={status} value={status}>
                {formatOrderStatus(status)}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Payment status"
            hideLabel
            value={filters.paymentStatus}
            onChange={(value) =>
              onFiltersChange((prev) => ({ ...prev, paymentStatus: value }))
            }
          >
            <option value="">All payment statuses</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      {orders.length > 0 ? (
        <div className="max-h-[calc(100vh-250px)] overflow-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Order Status</th>
                <th className="px-5 py-3 font-semibold">Payment Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3 font-medium">
                    <span className="font-mono text-xs">{order.id}</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {order.statusHistory.length > 0 ? (
                        order.statusHistory.map((entry) => (
                          <span
                            key={entry.id}
                            title={`${entry.note || formatOrderStatus(entry.status)} - ${formatDate(
                              entry.createdAt,
                            )}`}
                            className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
                          >
                            {formatOrderStatus(entry.status)}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
                          {formatOrderStatus(order.status)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-semibold">{order.customerName || "N/A"}</div>
                    <div className="text-xs text-slate-500">{order.customerEmail}</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id}>
                          <span className="font-medium">
                            {item.quantity} x {item.name}
                          </span>
                          {item.scentOption ? (
                            <span className="ml-1 text-xs font-semibold text-slate-500">
                              ({item.scentOption})
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {formatInr(order.totalAmount)}
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-600">
                    {formatPaymentMethod(order.paymentMethod)}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        onUpdateOrder(order.id, { status: event.target.value })
                      }
                    >
                      {orderStatusValues.map((status) => (
                        <option key={status} value={status}>
                          {formatOrderStatus(status)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      className="min-h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      value={order.paymentStatus}
                      disabled={updatingOrderId === order.id}
                      onChange={(event) =>
                        onUpdateOrder(order.id, {
                          paymentStatus: event.target.value,
                        })
                      }
                    >
                      {paymentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/api/admin/orders/${order.id}/invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        title="Open invoice preview"
                      >
                        View
                      </a>
                      <button
                        type="button"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        disabled={sendingInvoiceId === order.id}
                        onClick={() => {
                          void sendInvoice(order.id);
                        }}
                        title="Send invoice to customer email"
                      >
                        {sendingInvoiceId === order.id ? "Sending..." : "Send invoice"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No orders found" />
      )}
    </section>
  );
}

function CartsView({ carts }: { carts: AdminCart[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Customer carts
        </p>
        <h2 className="font-heading text-3xl font-semibold">Saved cart items</h2>
      </div>

      {carts.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {carts.map((cart) => (
            <article key={cart.user.id} className="p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">
                    {cart.user.name || "Unnamed customer"}
                  </h3>
                  <p className="text-sm text-slate-500">{cart.user.email}</p>
                </div>
                <div className="text-sm sm:text-right">
                  <p className="font-semibold">{formatInr(cart.subtotal)}</p>
                  <p className="text-slate-500">
                    {cart.totalQuantity} items · Updated {formatDate(cart.lastUpdatedAt)}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Qty</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Line Total</th>
                      <th className="px-4 py-3 font-semibold">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cart.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium">
                          {item.name}
                          {item.scentOption ? (
                            <span className="ml-1 text-xs font-semibold text-slate-500">
                              ({item.scentOption})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3">{formatInr(item.price)}</td>
                        <td className="px-4 py-3 font-semibold">
                          {formatInr(item.price * item.quantity)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(item.addedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No cart items found" />
      )}
    </section>
  );
}

function BestSellerView({
  settings,
  saving,
  evaluating,
  onChange,
  onSave,
  onEvaluate,
}: {
  settings: BestSellerSettings;
  saving: boolean;
  evaluating: boolean;
  onChange: Dispatch<SetStateAction<BestSellerSettings>>;
  onSave: (settings: BestSellerSettings) => void;
  onEvaluate: () => void;
}) {
  function toggleProduct(
    productId: string,
    key: "isBestSeller" | "isFeatured",
    checked: boolean,
  ) {
    onChange((prev) => ({
      mode: "manual",
      products: prev.products.map((product) =>
        product.id === productId ? { ...product, [key]: checked } : product,
      ),
    }));
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Sales automation
          </p>
          <h2 className="font-heading text-3xl font-semibold">
            Best sellers & trending
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Auto mode evaluates monthly sales. Manual mode lets you customize.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEvaluate}
            disabled={evaluating}
            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {evaluating ? "Evaluating..." : "Run auto now"}
          </button>
          <button
            type="button"
            onClick={() => onSave(settings)}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save manual changes"}
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-wrap gap-3">
          <ToggleField
            label="Auto monthly mode"
            checked={settings.mode === "auto"}
            onChange={(checked) =>
              onChange((prev) => ({
                ...prev,
                mode: checked ? "auto" : "manual",
              }))
            }
          />
          <StatusPill
            label={settings.mode === "auto" ? "AUTO" : "MANUAL"}
            tone={settings.mode === "auto" ? "green" : "warning"}
          />
        </div>
      </div>

      {settings.products.length > 0 ? (
        <div className="max-h-[calc(100vh-260px)] overflow-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Month sold</th>
                <th className="px-5 py-3 font-semibold">30-day sold</th>
                <th className="px-5 py-3 font-semibold">Total sold</th>
                <th className="px-5 py-3 font-semibold">Best seller</th>
                <th className="px-5 py-3 font-semibold">Trending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {settings.products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Admin product images can be local paths or runtime Cloudinary URLs. */}
                      <img
                        src={product.image}
                        alt=""
                        className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          {product.modelNo} / {product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {product.metrics.monthlySold}
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {product.metrics.trendingSold}
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {product.metrics.totalSold}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={product.isBestSeller}
                      onChange={(event) =>
                        toggleProduct(product.id, "isBestSeller", event.target.checked)
                      }
                      className="h-4 w-4 accent-slate-950"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={product.isFeatured}
                      onChange={(event) =>
                        toggleProduct(product.id, "isFeatured", event.target.checked)
                      }
                      className="h-4 w-4 accent-slate-950"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No products found" />
      )}
    </section>
  );
}

function ContactInquiriesView({ inquiries }: { inquiries: ContactInquiry[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Customer messages
        </p>
        <h2 className="font-heading text-3xl font-semibold">Contact inquiries</h2>
      </div>

      {inquiries.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {inquiries.map((inquiry) => (
            <article key={inquiry.id} className="p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h3 className="font-heading text-xl font-semibold">
                    {inquiry.subject}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>{inquiry.name}</span>
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="font-medium text-slate-700 hover:opacity-70"
                    >
                      {inquiry.email}
                    </a>
                    {inquiry.phone ? (
                      <a
                        href={`tel:${inquiry.phone}`}
                        className="font-medium text-slate-700 hover:opacity-70"
                      >
                        {inquiry.phone}
                      </a>
                    ) : null}
                  </div>
                </div>
                <p className="shrink-0 text-sm text-slate-500">
                  {formatDateTime(inquiry.createdAt)}
                </p>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {inquiry.message}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No contact inquiries found" />
      )}
    </section>
  );
}

function NewsletterSubscribersView({
  subscribers,
}: {
  subscribers: NewsletterSubscriber[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Newsletter
        </p>
        <h2 className="font-heading text-3xl font-semibold">Subscribers</h2>
      </div>

      {subscribers.length > 0 ? (
        <div className="max-h-[calc(100vh-220px)] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Subscribed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3">
                    <a
                      href={`mailto:${subscriber.email}`}
                      className="font-medium text-slate-800 hover:opacity-70"
                    >
                      {subscriber.email}
                    </a>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDateTime(subscriber.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No newsletter subscribers found" />
      )}
    </section>
  );
}

function ReviewsView({
  reviews,
  deletingReviewId,
  onDeleteReview,
  onReload,
}: {
  reviews: Review[];
  deletingReviewId: string | null;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onReload: () => Promise<void>;
}) {
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Customer feedback
          </p>
          <h2 className="font-heading text-3xl font-semibold">Product reviews</h2>
        </div>
        <button
          type="button"
          onClick={() => void onReload()}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh reviews
        </button>
      </div>

      <div className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-3">
        <StatCard label="Total reviews" value={`${reviews.length}`} />
        <StatCard label="Average rating" value={averageRating.toFixed(1)} />
        <StatCard
          label="Verified purchases"
          value={`${reviews.filter((review) => review.verifiedPurchase).length}`}
        />
      </div>

      {reviews.length > 0 ? (
        <div className="max-h-[calc(100vh-220px)] overflow-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Rating</th>
                <th className="px-5 py-3 font-semibold">Review</th>
                <th className="px-5 py-3 font-semibold">Purchase</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((review) => (
                <tr key={review.id} className="align-top hover:bg-slate-50/80">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- Review product images can be local paths or runtime Cloudinary URLs. */}
                      <img
                        src={review.product.image}
                        alt=""
                        className="h-11 w-11 rounded-lg border border-slate-200 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{review.product.name}</p>
                        <p className="truncate text-xs text-slate-500">{review.product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{review.user.name || "Unnamed customer"}</p>
                    <a
                      href={`mailto:${review.user.email}`}
                      className="text-xs font-medium text-slate-500 hover:opacity-70"
                    >
                      {review.user.email}
                    </a>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < review.rating ? "fill-current" : "text-slate-200"}`}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{review.rating}/5</p>
                  </td>
                  <td className="px-5 py-3">
                    {review.title ? (
                      <p className="font-semibold text-slate-900">{review.title}</p>
                    ) : null}
                    <p className="mt-1 max-h-24 overflow-hidden whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {review.comment}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill
                      label={review.verifiedPurchase ? "VERIFIED" : "UNVERIFIED"}
                      tone={review.verifiedPurchase ? "green" : "warning"}
                    />
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDateTime(review.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/products/${review.product.slug}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View product
                      </Link>
                      <button
                        type="button"
                        disabled={deletingReviewId === review.id}
                        onClick={() => void onDeleteReview(review.id)}
                        className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {deletingReviewId === review.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No reviews found" />
      )}
    </section>
  );
}

function UsersView({
  users,
  onViewOrders,
}: {
  users: AdminCustomer[];
  onViewOrders: (user: AdminCustomer) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Accounts
        </p>
        <h2 className="font-heading text-3xl font-semibold">Users</h2>
      </div>

      {users.length > 0 ? (
        <div className="max-h-[calc(100vh-220px)] overflow-auto">
          <table className="w-full min-w-[1320px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Verification</th>
                <th className="px-5 py-3 font-semibold">Sessions</th>
                <th className="px-5 py-3 font-semibold">Orders</th>
                <th className="px-5 py-3 font-semibold">Spent</th>
                <th className="px-5 py-3 font-semibold">Cart</th>
                <th className="px-5 py-3 font-semibold">Last Login</th>
                <th className="px-5 py-3 font-semibold">Last Seen</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3">
                    <div className="font-semibold">{user.name || "Unnamed user"}</div>
                    <a
                      href={`mailto:${user.email}`}
                      className="text-xs font-medium text-slate-600 hover:opacity-70"
                    >
                      {user.email}
                    </a>
                    <div className="mt-1 font-mono text-[11px] text-slate-400">
                      {user.id}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill
                      label={user.role}
                      tone={user.role === "ADMIN" ? "blue" : "neutral"}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <StatusPill
                      label={user.emailVerifiedAt ? "VERIFIED" : "UNVERIFIED"}
                      tone={user.emailVerifiedAt ? "green" : "warning"}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {user.emailVerifiedAt ? formatDateTime(user.emailVerifiedAt) : "N/A"}
                    </p>
                  </td>
                  <td className="px-5 py-3 font-medium">
                    {user.activeSessionCount}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      className="rounded-md text-left font-medium text-blue-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                      disabled={user.orderCount === 0}
                      title={
                        user.orderCount > 0
                          ? `View orders for ${user.email}`
                          : "No orders for this user"
                      }
                      onClick={() => onViewOrders(user)}
                    >
                      {user.orderCount}
                    </button>
                    <p className="text-xs text-slate-500">
                      Last: {user.lastOrderAt ? formatDate(user.lastOrderAt) : "N/A"}
                    </p>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    {formatInr(user.totalSpent)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium">
                      {user.cartQuantity} qty / {user.cartItemCount} lines
                    </p>
                    <p className="text-xs text-slate-500">
                      {user.lastCartUpdatedAt
                        ? formatDate(user.lastCartUpdatedAt)
                        : "No cart"}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "N/A"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {user.lastSeenAt ? formatDateTime(user.lastSeenAt) : "N/A"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDateTime(user.createdAt)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDateTime(user.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No users found" />
      )}
    </section>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/8 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          {label}
        </span>
        <Icon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function CouponsView({
  users,
  coupons,
  onReload,
  onError,
}: {
  users: AdminCustomer[];
  coupons: CouponAssignment[];
  onReload: () => Promise<void>;
  onError: Dispatch<SetStateAction<string | null>>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    code: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    description: "",
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    onError(null);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount || 0),
          maxDiscountAmount:
            form.discountType === "PERCENT" && form.maxDiscountAmount
              ? Number(form.maxDiscountAmount)
              : null,
        }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok || body?.error) {
        throw new Error(body?.error ?? "Failed to assign coupon");
      }
      await onReload();
      setForm((prev) => ({ ...prev, code: "", discountValue: "", description: "" }));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Failed to assign coupon");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Coupons</p>
        <h2 className="font-heading text-3xl font-semibold">Assign coupon to user</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <SelectField
            label="User"
            value={form.userId}
            onChange={(value) => setForm((prev) => ({ ...prev, userId: value }))}
            required
          >
            <option value="">Select user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Coupon code"
            value={form.code}
            onChange={(value) => setForm((prev) => ({ ...prev, code: value.toUpperCase() }))}
            required
          />
          <SelectField
            label="Discount type"
            value={form.discountType}
            onChange={(value) => setForm((prev) => ({ ...prev, discountType: value }))}
          >
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed</option>
          </SelectField>
          <InputField
            label="Discount value"
            type="number"
            value={form.discountValue}
            onChange={(value) => setForm((prev) => ({ ...prev, discountValue: value }))}
            required
          />
          <InputField
            label="Min order amount"
            type="number"
            value={form.minOrderAmount}
            onChange={(value) => setForm((prev) => ({ ...prev, minOrderAmount: value }))}
          />
          {form.discountType === "PERCENT" ? (
            <InputField
              label="Max discount amount"
              type="number"
              value={form.maxDiscountAmount}
              onChange={(value) => setForm((prev) => ({ ...prev, maxDiscountAmount: value }))}
            />
          ) : null}
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(value) => setForm((prev) => ({ ...prev, description: value }))}
            className="md:col-span-2"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Assigning..." : "Assign coupon"}
        </button>
      </form>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-semibold">User coupon assignments</h3>
        </div>
        <div className="max-h-[460px] overflow-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Discount</th>
                <th className="px-5 py-3 font-semibold">Min order</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.map((item) => (
                <tr key={item.userCouponId}>
                  <td className="px-5 py-3">{item.user.email}</td>
                  <td className="px-5 py-3 font-mono">{item.coupon.code}</td>
                  <td className="px-5 py-3">
                    {item.coupon.discountType === "PERCENT"
                      ? `${item.coupon.discountValue}%`
                      : formatInr(item.coupon.discountValue)}
                  </td>
                  <td className="px-5 py-3">{formatInr(item.coupon.minOrderAmount)}</td>
                  <td className="px-5 py-3">
                    <StatusPill
                      label={item.usedAt ? "USED" : item.assignmentActive ? "ACTIVE" : "INACTIVE"}
                      tone={item.usedAt ? "neutral" : item.assignmentActive ? "green" : "warning"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PanelHeader({
  actionLabel,
  eyebrow,
  title,
  onAction,
}: {
  actionLabel: string;
  eyebrow: string;
  title: string;
  onAction: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {eyebrow}
        </p>
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
      </div>
      <button
        type="button"
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function SettingsView({
  settings,
  savingSettings,
  onChange,
  onSave,
}: {
  settings: SiteSettings;
  savingSettings: boolean;
  onChange: Dispatch<SetStateAction<SiteSettings>>;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Storefront
        </p>
        <h2 className="font-heading text-3xl font-semibold">Site settings</h2>
      </div>

      <form onSubmit={onSave} className="space-y-5">
        <TextAreaField
          label="Promotional line"
          value={settings.promoBannerText}
          onChange={(value) =>
            onChange((prev) => ({ ...prev, promoBannerText: value }))
          }
          required
        />

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Preview
          </p>
          <div className="bg-[#1A1A1A] px-4 py-2 text-center text-sm font-medium text-white">
            {settings.promoBannerText ||
              "Free Shipping on Orders over 30KWD - Arrives Next Day From 5 to 9 PM"}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Call phone number"
            value={settings.contactPhone}
            onChange={(value) =>
              onChange((prev) => ({ ...prev, contactPhone: value }))
            }
            placeholder="+96500000000"
          />
          <InputField
            label="Email address"
            value={settings.contactEmail}
            onChange={(value) =>
              onChange((prev) => ({ ...prev, contactEmail: value }))
            }
            placeholder="support@scentora.com"
          />
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Footer social links
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Facebook URL"
              value={settings.facebookUrl}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, facebookUrl: value }))
              }
              placeholder="https://facebook.com/your-page"
            />
            <InputField
              label="X URL"
              value={settings.xUrl}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, xUrl: value }))
              }
              placeholder="https://x.com/your-handle"
            />
            <InputField
              label="YouTube URL"
              value={settings.youtubeUrl}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, youtubeUrl: value }))
              }
              placeholder="https://youtube.com/@your-channel"
            />
            <InputField
              label="Instagram URL"
              value={settings.instagramUrl}
              onChange={(value) =>
                onChange((prev) => ({ ...prev, instagramUrl: value }))
              }
              placeholder="https://instagram.com/your-handle"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingSettings}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {savingSettings ? "Saving..." : "Save settings"}
        </button>
      </form>
    </section>
  );
}

function InputField({
  value,
  onChange,
  label,
  className,
  disabled,
  hideLabel,
  type = "text",
  required,
  min,
  step,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  disabled?: boolean;
  hideLabel?: boolean;
  type?: "text" | "number";
  required?: boolean;
  min?: string;
  step?: string;
  placeholder?: string;
}) {
  const id = `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`${hideLabel ? "sr-only" : "mb-2 block"} text-sm font-medium text-slate-700`}
      >
        {label}
      </label>
      <input
        id={id}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        placeholder={placeholder}
        value={value}
        type={type}
        disabled={disabled}
        required={required}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function TextAreaField({
  value,
  onChange,
  label,
  className,
  required,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  children,
  hideLabel,
  label,
  value,
  onChange,
  required,
}: {
  children: ReactNode;
  hideLabel?: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const id = `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div>
      <label
        htmlFor={id}
        className={`${hideLabel ? "sr-only" : "mb-2 block"} text-sm font-medium text-slate-700`}
      >
        {label}
      </label>
      <select
        id={id}
        className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-500 focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-slate-950/10 lg:max-w-sm">
      <Search className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{placeholder}</span>
      <input
        className="min-w-0 flex-1 bg-transparent text-slate-950 outline-none"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className={`relative h-5 w-9 rounded-full transition ${
          checked ? "bg-slate-950" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </span>
      {label}
    </label>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "accent" | "blue" | "danger" | "green" | "neutral" | "warning";
}) {
  const toneClass = {
    accent: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
  }[tone];

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2 text-xs font-semibold ${toneClass}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="grid min-h-48 place-items-center px-5 py-10 text-center text-sm text-slate-500">
      <div>
        <Boxes className="mx-auto mb-3 h-8 w-8 text-slate-300" aria-hidden="true" />
        <p>{title}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function LoadingPanel() {
  return (
    <section className="grid min-h-64 place-items-center rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
      Loading admin dashboard...
    </section>
  );
}

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPaymentMethod(value: string) {
  return value === "CASH_ON_DELIVERY" ? "Cash on Delivery" : value;
}
