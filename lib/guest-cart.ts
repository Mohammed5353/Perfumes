export type GuestCartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  scentOption?: string;
};

const GUEST_CART_KEY = "scentora:guest-cart";

export function getGuestCart() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as GuestCartItem[];
    return Array.isArray(parsed) ? parsed.filter(isGuestCartItem) : [];
  } catch {
    return [];
  }
}

export function addGuestCartItem(item: GuestCartItem) {
  const cart = getGuestCart();
  const existing = cart.find(
    (cartItem) =>
      cartItem.productId === item.productId &&
      (cartItem.scentOption ?? "") === (item.scentOption ?? ""),
  );

  if (existing) {
    existing.quantity = clampQuantity(existing.quantity + item.quantity);
  } else {
    cart.push({
      ...item,
      quantity: clampQuantity(item.quantity),
    });
  }

  saveGuestCart(cart);
  notifyGuestCartUpdated();
}

export function updateGuestCartItem(productId: string, quantity: number, scentOption = "") {
  const cart = getGuestCart()
    .map((item) =>
      item.productId === productId && (item.scentOption ?? "") === scentOption
        ? { ...item, quantity: clampQuantity(quantity) }
        : item,
    )
    .filter((item) => item.quantity > 0);

  saveGuestCart(cart);
  notifyGuestCartUpdated();
}

export function removeGuestCartItem(productId: string, scentOption = "") {
  saveGuestCart(
    getGuestCart().filter(
      (item) =>
        item.productId !== productId || (item.scentOption ?? "") !== scentOption,
    ),
  );
  notifyGuestCartUpdated();
}

export function clearGuestCart() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(GUEST_CART_KEY);
    notifyGuestCartUpdated();
  }
}

export async function mergeGuestCartIntoAccount() {
  const cart = getGuestCart();

  if (cart.length === 0) {
    return;
  }

  const results = await Promise.all(
    cart.map((item) =>
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          scentOption: item.scentOption ?? "",
        }),
      }),
    ),
  );

  if (results.every((response) => response.ok)) {
    clearGuestCart();
    window.dispatchEvent(new Event("scentora:auth-updated"));
  }
}

export function getGuestCartQuantity() {
  return getGuestCart().reduce((total, item) => total + item.quantity, 0);
}

function saveGuestCart(cart: GuestCartItem[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  }
}

function notifyGuestCartUpdated() {
  window.dispatchEvent(new Event("scentora:cart-updated"));
}

function clampQuantity(value: number) {
  if (!Number.isInteger(value) || value < 1) {
    return 1;
  }

  return Math.min(value, 99);
}

function isGuestCartItem(value: unknown): value is GuestCartItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.name === "string" &&
    typeof item.image === "string" &&
    typeof item.price === "number" &&
    typeof item.quantity === "number" &&
    (typeof item.scentOption === "undefined" || typeof item.scentOption === "string")
  );
}
